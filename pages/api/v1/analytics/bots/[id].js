import { connectDB } from "../../../../../lib/mongoose";
import BotAnalytics from "../../../../../lib/models/BotAnalytics";
import Conversation from "../../../../../lib/models/Conversation";
import { withAuth, withTeamAuth } from "../../../../../lib/middleware";
import { rateLimit } from "../../../../../lib/rateLimit";
import { logger } from "../../../../../lib/logger";

const limiter = rateLimit(100, 60000);

/**
 * @swagger
 * /api/v1/analytics/bots/{id}:
 *   get:
 *     summary: Get bot analytics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [overview, sentiment, resolution, topics, traffic]
 */

export default async function handler(req, res) {
  limiter(req, res, () => {});

  try {
    await connectDB();
    await withAuth(req, res, () => {});

    if (!req.user) return;

    const { id } = req.query;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    const metric = req.query.metric || "overview";

    // Get analytics
    const analytics = await BotAnalytics.find({
      botId: id,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: -1 });

    if (analytics.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          botId: id,
          period: { startDate, endDate },
          metrics: {
            totalConversations: 0,
            totalMessages: 0,
            totalUsers: 0,
            avgResponseTime: 0,
            avgSatisfaction: 0,
          },
        },
      });
    }

    // Aggregate metrics
    const aggregated = {
      totalConversations: analytics.reduce((sum, a) => sum + a.metrics.totalConversations, 0),
      totalMessages: analytics.reduce((sum, a) => sum + a.metrics.totalMessages, 0),
      totalUsers: analytics.reduce((sum, a) => sum + a.metrics.totalUsers, 0),
      avgResponseTime: Math.round(analytics.reduce((sum, a) => sum + a.metrics.avgResponseTime, 0) / analytics.length),
      avgSatisfaction: (analytics.reduce((sum, a) => sum + a.metrics.avgSatisfactionScore, 0) / analytics.length).toFixed(2),
    };

    let response = {
      success: true,
      data: {
        botId: id,
        period: { startDate, endDate },
        metrics: aggregated,
        analytics,
      },
    };

    // Add metric-specific data
    if (metric === "sentiment") {
      response.data.sentiment = {
        positive: analytics.reduce((sum, a) => sum + a.sentiment.positive, 0),
        neutral: analytics.reduce((sum, a) => sum + a.sentiment.neutral, 0),
        negative: analytics.reduce((sum, a) => sum + a.sentiment.negative, 0),
      };
    } else if (metric === "resolution") {
      response.data.resolutions = {
        resolved: analytics.reduce((sum, a) => sum + a.resolutions.resolved, 0),
        unresolved: analytics.reduce((sum, a) => sum + a.resolutions.unresolved, 0),
        escalated: analytics.reduce((sum, a) => sum + a.resolutions.escalated, 0),
      };
    } else if (metric === "topics") {
      const topicMap = {};
      analytics.forEach(a => {
        a.topTopics?.forEach(t => {
          topicMap[t.topic] = (topicMap[t.topic] || 0) + t.count;
        });
      });
      response.data.topTopics = Object.entries(topicMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([topic, count]) => ({ topic, count }));
    } else if (metric === "traffic") {
      response.data.trafficSource = {
        web: analytics.reduce((sum, a) => sum + a.trafficSource.web, 0),
        api: analytics.reduce((sum, a) => sum + a.trafficSource.api, 0),
        embed: analytics.reduce((sum, a) => sum + a.trafficSource.embed, 0),
        slack: analytics.reduce((sum, a) => sum + a.trafficSource.slack, 0),
        discord: analytics.reduce((sum, a) => sum + a.trafficSource.discord, 0),
      };
    }

    logger.info("Get bot analytics", { botId: id });

    return res.status(200).json(response);
  } catch (err) {
    logger.error("Analytics API error", { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
}
