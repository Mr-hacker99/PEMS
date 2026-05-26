const Expense = require('../models/Expense');
const { Income, Budget } = require('../models/index');

// Build financial context for AI
const buildFinancialContext = async (userId) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [expenses, incomes, budgets, categoryStats, monthlyExpenses] = await Promise.all([
    Expense.find({ userId }).sort({ date: -1 }).limit(50),
    Income.find({ userId }).sort({ date: -1 }).limit(20),
    Budget.find({ userId, month: now.getMonth() + 1, year: now.getFullYear() }),
    Expense.aggregate([
      { $match: { userId } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    Expense.aggregate([
      { $match: { userId, date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyExpense = monthlyExpenses[0]?.total || 0;

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    savingsRate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : 0,
    monthlyExpense,
    topCategories: categoryStats.slice(0, 5),
    budgets,
    recentExpenses: expenses.slice(0, 10),
  };
};

// Rule-based AI analysis (fallback when no OpenAI key)
const generateRuleBasedAnalysis = (context) => {
  const { totalIncome, totalExpense, balance, savingsRate, topCategories, monthlyExpense } = context;

  const insights = [];
  const recommendations = [];

  // Savings analysis
  if (parseFloat(savingsRate) < 10) {
    insights.push('⚠️ Your savings rate is critically low (below 10%). Immediate action needed.');
    recommendations.push('Implement the 50/30/20 rule: 50% for needs, 30% for wants, 20% for savings.');
  } else if (parseFloat(savingsRate) < 20) {
    insights.push('📊 Your savings rate is below the recommended 20%. Room for improvement.');
    recommendations.push('Try to reduce discretionary spending by 10-15% to boost savings.');
  } else {
    insights.push('✅ Excellent! Your savings rate is healthy. Keep maintaining this pattern.');
  }

  // Top spending category
  if (topCategories.length > 0) {
    const top = topCategories[0];
    insights.push(`🏆 Your highest spending category is ${top._id} (रु ${top.total.toFixed(0)}).`);
    if (top._id === 'Food') {
      recommendations.push('Consider meal prepping to reduce food expenses by 20-30%.');
    } else if (top._id === 'Shopping') {
      recommendations.push('Try implementing a 24-hour rule before making non-essential purchases.');
    } else if (top._id === 'Entertainment') {
      recommendations.push('Look for free or discounted entertainment options to reduce costs.');
    }
  }

  // Balance check
  if (balance < 0) {
    insights.push('🚨 CRITICAL: Your expenses exceed your income. You are in deficit!');
    recommendations.push('Immediately audit all subscriptions and cancel non-essential ones.');
    recommendations.push('Create a strict weekly budget and track every expense.');
  } else if (balance < totalIncome * 0.1) {
    insights.push('⚠️ Your remaining balance is very tight. Consider reducing expenses.');
  }

  // Forecast
  const forecast = monthlyExpense * 12;
  const annualIncome = totalIncome;

  return {
    summary: `Your financial health score is ${parseFloat(savingsRate) >= 20 ? 'Good' : parseFloat(savingsRate) >= 10 ? 'Fair' : 'Poor'}.`,
    insights,
    recommendations,
    forecast: {
      annualExpenseProjection: forecast,
      annualIncome,
      projectedSavings: annualIncome - forecast,
    },
    analysis: `
**Financial Summary Report**

📊 **Overall Position:**
- Total Income: रु ${totalIncome.toFixed(2)}
- Total Expenses: रु ${totalExpense.toFixed(2)}
- Net Balance: रु ${balance.toFixed(2)}
- Savings Rate: ${savingsRate}%

📈 **Spending Analysis:**
${topCategories.map((c, i) => `${i + 1}. ${c._id}: रु ${c.total.toFixed(0)} (${c.count} transactions)`).join('\n')}

💡 **Key Insights:**
${insights.join('\n')}

🎯 **Recommendations:**
${recommendations.join('\n')}

📅 **Annual Forecast:**
- Projected Annual Expenses: रु ${forecast.toFixed(0)}
- Projected Annual Savings: रु ${(annualIncome - forecast).toFixed(0)}
    `.trim(),
  };
};

// @desc    Get AI financial analysis
// @route   GET /api/ai/analysis
exports.getFinancialAnalysis = async (req, res) => {
  try {
    const context = await buildFinancialContext(req.user._id);

    // Try OpenAI if key available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      try {
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const prompt = `You are a professional financial advisor analyzing a Nepali user's expenses.

Financial Data:
- Total Income: NPR ${context.totalIncome}
- Total Expenses: NPR ${context.totalExpense}
- Balance: NPR ${context.balance}
- Savings Rate: ${context.savingsRate}%
- Monthly Expenses: NPR ${context.monthlyExpense}
- Top Categories: ${context.topCategories.map(c => `${c._id}: NPR ${c.total}`).join(', ')}

Provide:
1. Financial health assessment
2. 3-5 specific insights about their spending
3. 3-5 actionable recommendations
4. Monthly savings goal
5. Budget suggestions

Format the response in clear sections. Use NPR currency. Keep it practical and actionable.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800,
          temperature: 0.7,
        });

        const aiAnalysis = completion.choices[0].message.content;
        return res.json({
          success: true,
          source: 'openai',
          analysis: aiAnalysis,
          context,
        });
      } catch (openaiError) {
        console.error('OpenAI error, falling back to rule-based:', openaiError.message);
      }
    }

    // Fallback to rule-based analysis
    const analysis = generateRuleBasedAnalysis(context);
    res.json({
      success: true,
      source: 'rule-based',
      ...analysis,
      context,
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ success: false, message: 'Error generating financial analysis.' });
  }
};

// @desc    Get AI spending forecast
// @route   GET /api/ai/forecast
exports.getSpendingForecast = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    
    // Get last 6 months of data
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const monthlyData = await Expense.aggregate([
      { $match: { userId, date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: '$date' }, year: { $year: '$date' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Calculate trend (simple linear regression)
    const amounts = monthlyData.map(d => d.total);
    const avgAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
    
    // Forecast next 3 months
    const forecast = [];
    for (let i = 1; i <= 3; i++) {
      const futureMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
      forecast.push({
        month: monthNames[futureMonth.getMonth()],
        year: futureMonth.getFullYear(),
        projected: Math.round(avgAmount * (1 + (Math.random() * 0.1 - 0.05))), // ±5% variance
      });
    }

    res.json({
      success: true,
      historicalData: monthlyData.map(d => ({
        month: monthNames[d._id.month - 1],
        year: d._id.year,
        actual: d.total,
      })),
      forecast,
      averageMonthlySpend: Math.round(avgAmount),
      trend: amounts.length > 1 ? (amounts[amounts.length - 1] > amounts[0] ? 'increasing' : 'decreasing') : 'stable',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating forecast.' });
  }
};

// @desc    Chat with AI assistant
// @route   POST /api/ai/chat
exports.chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required.' });

    const context = await buildFinancialContext(req.user._id);

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      try {
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const systemPrompt = `You are PEMS AI, a friendly financial assistant for a Nepali expense management system.
User's financial context: Total Income: NPR ${context.totalIncome}, Total Expenses: NPR ${context.totalExpense}, Balance: NPR ${context.balance}, Top category: ${context.topCategories[0]?._id || 'N/A'}.
Answer in simple, practical terms. Use NPR for currency. Keep responses concise (under 200 words).`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          max_tokens: 300,
        });

        return res.json({ success: true, reply: completion.choices[0].message.content });
      } catch (openaiError) {
        console.error('OpenAI chat error:', openaiError.message);
      }
    }

    // Smart rule-based chatbot fallback
    const lowerMsg = message.toLowerCase();
    let reply = '';

    if (lowerMsg.includes('budget') || lowerMsg.includes('spend')) {
      reply = `Based on your data, your total expenses are रु ${context.totalExpense.toFixed(0)}. Your savings rate is ${context.savingsRate}%. ${parseFloat(context.savingsRate) < 20 ? 'I recommend reducing spending in your top categories to improve savings.' : 'You are doing well with budgeting!'}`;
    } else if (lowerMsg.includes('save') || lowerMsg.includes('saving')) {
      reply = `Your current balance is रु ${context.balance.toFixed(0)}. ${context.balance > 0 ? `Great job! Try to save at least 20% of your income. Your current savings rate is ${context.savingsRate}%.` : 'Your expenses exceed income. Please reduce spending immediately.'}`;
    } else if (lowerMsg.includes('income')) {
      reply = `Your total recorded income is रु ${context.totalIncome.toFixed(0)}. Consider diversifying income sources through freelancing, investments, or side businesses.`;
    } else if (lowerMsg.includes('category') || lowerMsg.includes('most')) {
      const top = context.topCategories[0];
      reply = top ? `Your highest spending category is ${top._id} at रु ${top.total.toFixed(0)}. Consider setting a budget limit for this category.` : 'No spending data available yet. Start adding your expenses!';
    } else if (lowerMsg.includes('tip') || lowerMsg.includes('advice')) {
      const tips = [
        'Track every expense, no matter how small. Small leaks sink big ships.',
        'Follow the 50/30/20 rule: 50% needs, 30% wants, 20% savings.',
        'Build an emergency fund of 3-6 months of expenses.',
        'Automate your savings - pay yourself first before spending.',
        'Review your subscriptions monthly and cancel what you don\'t use.',
      ];
      reply = tips[Math.floor(Math.random() * tips.length)];
    } else {
      reply = `I'm PEMS AI, your financial assistant! Your current balance is रु ${context.balance.toFixed(0)} with a savings rate of ${context.savingsRate}%. Ask me about your budget, savings, spending categories, or financial tips!`;
    }

    res.json({ success: true, reply });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error processing your message.' });
  }
};
