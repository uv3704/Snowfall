import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getRolling24hSentCount } from '@/lib/services/user.service';
import { getCampaignById } from '@/lib/services/campaign.service';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('campaignId');

    const rolling24h = await getRolling24hSentCount(user?.id);
    const dailyQuotaMax = 45;
    const quotaRemaining = Math.max(0, dailyQuotaMax - rolling24h);

    if (!campaignId) {
      return NextResponse.json({
        success: true,
        stats: {
          total: 0,
          sent: 0,
          failed: 0,
          suppressed: 0,
          pending: 0,
          rolling24hUsed: rolling24h,
          dailyQuotaMax,
          quotaRemaining,
          todayDispatched: 0,
          todayTarget: 45,
        },
        status: 'idle',
      });
    }

    const campaignData = await getCampaignById(campaignId, user?.id);

    if (!campaignData || !campaignData.campaign) {
      return NextResponse.json({
        success: true,
        stats: {
          total: 0,
          sent: 0,
          failed: 0,
          suppressed: 0,
          pending: 0,
          rolling24hUsed: rolling24h,
          dailyQuotaMax,
          quotaRemaining,
          todayDispatched: 0,
          todayTarget: 45,
        },
        status: 'idle',
      });
    }

    const campaign = campaignData.campaign;
    const recipients = campaignData.recipients || [];

    const total = recipients.length;
    const sent = recipients.filter((r: any) => r.status === 'sent').length;
    const failed = recipients.filter((r: any) => r.status === 'failed').length;
    const suppressed = recipients.filter((r: any) => r.status === 'suppressed').length;
    const pending = recipients.filter((r: any) => r.status === 'pending' || r.status === 'scheduled').length;
    const active = recipients.filter((r: any) => r.status === 'claimed' || r.status === 'sending').length;

    // Today's dispatched count for this campaign
    const todayDispatched = recipients.filter((r: any) => {
      if (!r.sentAt && !r.lastAttemptAt) return false;
      const date = new Date(r.sentAt || r.lastAttemptAt);
      const isPast24h = (Date.now() - date.getTime()) < 24 * 60 * 60 * 1000;
      return isPast24h && (r.status === 'sent' || r.status === 'failed' || r.status === 'suppressed');
    }).length;

    return NextResponse.json({
      success: true,
      status: campaign?.status || 'idle',
      stats: {
        total,
        sent,
        failed,
        suppressed,
        pending,
        active,
        rolling24hUsed: rolling24h,
        dailyQuotaMax,
        quotaRemaining,
        todayDispatched,
        todayTarget: Math.min(dailyQuotaMax, total),
      },
      recipients,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
