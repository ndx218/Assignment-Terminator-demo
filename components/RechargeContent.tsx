'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TopNavigation from '@/components/TopNavigation';

// Dynamically load Stripe
const getStripePromise = () => {
  if (typeof window === 'undefined') return null;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Stripe payments will not work.');
    return null;
  }
  try {
    return import('@stripe/stripe-js').then(({ loadStripe }) => loadStripe(publishableKey));
  } catch (e) {
    console.warn('Stripe JS not loaded. Please install @stripe/stripe-js');
    return null;
  }
};

type PaymentMethod = 'stripe' | 'alipay' | 'wechat';
type PackageType = 'first' | 'starter' | 'budget' | 'standard' | 'premium';

export default function RechargeContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [skipLogin, setSkipLogin] = useState<boolean | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('alipay');
  const [selectedPackage, setSelectedPackage] = useState<PackageType>('first');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const skip = localStorage.getItem('skipLogin') === 'true';
      setSkipLogin(skip);

      // Handle Stripe redirect
      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === 'true') {
        setSuccess(true);
        // Clear URL params
        window.history.replaceState({}, '', '/recharge');
      } else if (params.get('canceled') === 'true') {
        setSuccess(false);
        // Clear URL params
        window.history.replaceState({}, '', '/recharge');
      }
    }
  }, []);

  useEffect(() => {
    if (skipLogin === false && status === 'unauthenticated') {
      router.push('/login');
    }
  }, [skipLogin, status]);

  useEffect(() => {
    // Mock: 後台載入充值紀錄
    setRecords([
      {
        name: '小明',
        contact: 'WeChat123',
        time: '2025-05-13 17:30',
        img: '/sample-payment.png',
      },
    ]);
  }, []);

  const handleStripePayment = async () => {
    if (!session?.user?.id) {
      alert('⚠️ 請先登入');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/payments/create-stripe-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageType: selectedPackage,
          referralCode: referralCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create payment session');
      }

      const stripePromise = getStripePromise();
      if (!stripePromise) {
        throw new Error('Stripe 未配置。請設置 NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 環境變數。');
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe 初始化失敗');
      }

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('[Stripe Payment Error]', err);
      const errorMessage = err.message || err.error?.message || '未知錯誤';
      alert(`❌ 付款失敗：${errorMessage}\n\n請檢查：\n1. Stripe API keys 是否正確配置\n2. 瀏覽器控制台查看詳細錯誤\n3. 服務器日誌查看錯誤詳情`);
      setSuccess(false);
      setIsSubmitting(false);
    }
  };

  const handleManualPayment = async () => {
    if (!name || !contact || !file) {
      alert('⚠️ 請填寫所有欄位並選擇截圖');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('phone', contact);
    formData.append('screenshot', file);
    formData.append('referralCode', referralCode);
    formData.append('paymentMethod', paymentMethod);
    formData.append('packageType', selectedPackage);

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/upload-payment', {
        method: 'POST',
        body: formData,
      });
      const ok = res.ok;
      setSuccess(ok);
      if (ok) {
        setName('');
        setContact('');
        setReferralCode('');
        setFile(null);
        setPreviewUrl(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
      setSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (paymentMethod === 'stripe') {
      handleStripePayment();
    } else {
      handleManualPayment();
    }
  };

  if (skipLogin === null || (!skipLogin && status === 'loading')) {
    return <div className="h-screen flex items-center justify-center text-gray-500">⏳ 載入中...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)', backgroundAttachment: 'fixed' }}>
      <TopNavigation />
      <div className="pt-20 max-w-4xl mx-auto p-6 space-y-8">
        <h2 className="text-2xl font-bold text-white">💳 點數充值</h2>

        {/* 套餐表格 */}
        <div className="overflow-x-auto">
        <table className="w-full border border-slate-600 text-sm bg-slate-800">
          <thead className="bg-slate-700">
            <tr>
              <th className="border border-slate-600 px-3 py-2 text-left text-white">套餐名稱</th>
              <th className="border border-slate-600 px-3 py-2 text-center text-white">金額</th>
              <th className="border border-slate-600 px-3 py-2 text-center text-white">點數</th>
              <th className="border border-slate-600 px-3 py-2 text-center text-white">每點成本</th>
              <th className="border border-slate-600 px-3 py-2 text-white">備註</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-600 px-3 py-2 text-slate-300">🎁 首充套餐</td>
              <td className="border border-slate-600 px-3 py-2 text-center text-slate-300">$10</td>
              <td className="border border-slate-600 px-3 py-2 text-center text-slate-300">25 + 推薦點</td>
              <td className="border border-slate-600 px-3 py-2 text-center text-slate-300">$0.40</td>
              <td className="border border-slate-600 px-3 py-2 text-slate-300">推薦有獎</td>
            </tr>
            <tr>
              <td className="border border-slate-600 px-3 py-2 text-slate-300">💡 入門套餐</td>
              <td className="border border-slate-600 px-3 py-2 text-center text-slate-300">$20</td>
              <td className="border border-slate-600 px-3 py-2 text-center text-slate-300">20</td>
              <td className="border border-slate-600 px-3 py-2 text-center text-slate-300">$1</td>
              <td className="border border-slate-600 px-3 py-2 text-slate-300">一般小額使用者</td>
            </tr>
            <tr>
              <td className="border border-slate-600 px-3 py-2 text-slate-300">💼 小資套餐</td>
              <td className="border border-slate-600 px-3 py-2 text-center text-slate-300">$30</td>
              <td className="border border-slate-600 px-3 py-2 text-center text-slate-300">35</td>
              <td className="border border-slate-600 px-3 py-2 text-center text-slate-300">$0.86</td>
              <td className="border border-slate-600 px-3 py-2 text-slate-300">穩定銷售款</td>
            </tr>
            <tr>
              <td className="border border-slate-600 px-3 py-2 text-slate-300">📘 標準套餐</td>
              <td className="border border-slate-600 px-3 py-2 text-center text-slate-300">$50</td>
              <td className="border border-slate-600 px-3 py-2 text-center text-slate-300">60</td>
              <td className="border border-slate-600 px-3 py-2 text-center text-slate-300">$0.83</td>
              <td className="border border-slate-600 px-3 py-2 text-slate-300">高頻使用者</td>
            </tr>
            <tr>
              <td className="border border-slate-600 px-3 py-2 text-slate-300">💎 高級套餐</td>
              <td className="border border-slate-600 px-3 py-2 text-center text-slate-300">$100</td>
              <td className="border border-slate-600 px-3 py-2 text-center text-slate-300">125</td>
              <td className="border border-slate-600 px-3 py-2 text-center text-slate-300">$0.80</td>
              <td className="border border-slate-600 px-3 py-2 text-slate-300">送 25 點</td>
            </tr>
          </tbody>
        </table>
        </div>

        {/* 付款說明 */}
        <div className="bg-amber-900/30 border border-amber-600 text-sm text-amber-200 rounded-md p-4">
        <p className="font-semibold mb-2">📌 付款說明：</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>請選擇付款方式：<strong>Stripe（信用卡）</strong>、<strong>Alipay（香港）</strong> 或 <strong>WeChat Pay（微信支付）</strong>。</li>
          <li>使用 Stripe 付款將自動開通點數，無需等待。</li>
          <li>使用 Alipay 或 WeChat Pay 時，請上傳付款截圖並填寫你的姓名與聯絡方式。</li>
          <li>人工處理將於 <strong>24 小時內</strong> 開通點數，如遇週末或深夜略有延遲 🙏。</li>
          <li>若有推薦碼，請填寫以獲得額外點數。</li>
        </ul>
        </div>

        {/* 套餐選擇 */}
        <div className="bg-slate-800 rounded-lg p-4">
          <label className="block text-white font-semibold mb-2">選擇套餐：</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { id: 'first' as PackageType, label: '首充 $10', points: '25+' },
              { id: 'starter' as PackageType, label: '入門 $20', points: '20' },
              { id: 'budget' as PackageType, label: '小資 $30', points: '35' },
              { id: 'standard' as PackageType, label: '標準 $50', points: '60' },
              { id: 'premium' as PackageType, label: '高級 $100', points: '125' },
            ].map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`p-3 rounded border-2 transition ${
                  selectedPackage === pkg.id
                    ? 'border-blue-500 bg-blue-900/30 text-white'
                    : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="font-semibold">{pkg.label}</div>
                <div className="text-xs mt-1">{pkg.points} 點</div>
              </button>
            ))}
          </div>
        </div>

        {/* 付款方式選擇 */}
        <div className="bg-slate-800 rounded-lg p-4">
          <label className="block text-white font-semibold mb-2">選擇付款方式：</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => setPaymentMethod('stripe')}
              className={`p-4 rounded border-2 transition text-left ${
                paymentMethod === 'stripe'
                  ? 'border-blue-500 bg-blue-900/30 text-white'
                  : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="font-semibold mb-1">💳 Stripe（信用卡）</div>
              <div className="text-xs">即時開通，支援 Visa/Master/Amex</div>
            </button>
            <button
              onClick={() => setPaymentMethod('alipay')}
              className={`p-4 rounded border-2 transition text-left ${
                paymentMethod === 'alipay'
                  ? 'border-blue-500 bg-blue-900/30 text-white'
                  : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="font-semibold mb-1">📱 Alipay（香港）</div>
              <div className="text-xs">掃描 QR Code 付款</div>
            </button>
            <button
              onClick={() => setPaymentMethod('wechat')}
              className={`p-4 rounded border-2 transition text-left ${
                paymentMethod === 'wechat'
                  ? 'border-blue-500 bg-blue-900/30 text-white'
                  : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="font-semibold mb-1">💬 WeChat Pay（微信支付）</div>
              <div className="text-xs">掃描 QR Code 付款</div>
            </button>
          </div>
        </div>

        {/* 付款方式詳細資訊 */}
        {paymentMethod === 'stripe' && (
          <div className="bg-blue-900/20 border border-blue-600 text-sm text-blue-200 rounded-md p-4">
            <p className="font-semibold mb-2">💳 Stripe 付款：</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>點擊下方「提交付款」按鈕後，將跳轉至 Stripe 安全付款頁面。</li>
              <li>支援 Visa、Mastercard、American Express 等信用卡。</li>
              <li>付款成功後，點數將<strong>自動立即開通</strong>，無需等待。</li>
            </ul>
          </div>
        )}

        {paymentMethod === 'alipay' && (
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-sm space-y-2 text-slate-300">
              <div>
                <strong className="text-white">📱 Alipay（香港）：</strong>
                <img src="/alipay-qr.png" alt="Alipay QR" width={180} height={180} className="mt-2 bg-white p-2 rounded" />
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'wechat' && (
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-sm space-y-2 text-slate-300">
              <div>
                <strong className="text-white">💬 WeChat Pay（微信支付）：</strong>
                <div className="mt-2 text-amber-300">
                  <p>請掃描以下 QR Code 或添加微信：</p>
                  <p className="font-mono text-lg mt-2">WeChat: AA551218aa</p>
                  <p className="text-xs mt-2 text-slate-400">（QR Code 圖片可上傳至 /public/wechat-qr.png）</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 表單輸入區域（僅手動付款方式需要） */}
        {paymentMethod !== 'stripe' && (
          <>
            <Input placeholder="你的姓名" value={name} onChange={(e) => setName(e.target.value)} className="bg-white" />
            <Input placeholder="聯絡方式（微信 / WhatsApp）" value={contact} onChange={(e) => setContact(e.target.value)} className="bg-white" />
            <Input placeholder="推薦碼（可選）" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className="bg-white" />
            <Input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setFile(file);
              setPreviewUrl(file ? URL.createObjectURL(file) : null);
            }} className="bg-white" />

            {previewUrl && (
              <div className="flex justify-center">
                <img src={previewUrl} alt="預覽圖" className="rounded-lg mt-2 max-w-[200px]" />
              </div>
            )}
          </>
        )}

        {paymentMethod === 'stripe' && (
          <Input placeholder="推薦碼（可選）" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className="bg-white" />
        )}

        <Button onClick={handleSubmit} isLoading={isSubmitting} className="w-full">
          {paymentMethod === 'stripe' ? '💳 前往 Stripe 付款' : '📤 提交付款資料'}
        </Button>

        {success === true && (
          <div className="bg-green-900/30 border border-green-600 text-green-200 rounded-md p-4">
            {paymentMethod === 'stripe' ? (
              <p>✅ Stripe 付款成功！點數已自動開通</p>
            ) : (
              <p>✅ 上傳成功！請等待人工開通（24小時內）</p>
            )}
          </div>
        )}
        {success === false && (
          <div className="bg-red-900/30 border border-red-600 text-red-200 rounded-md p-4">
            <p>❌ {paymentMethod === 'stripe' ? '付款失敗，請稍後再試' : '上傳失敗，請稍後再試'}</p>
          </div>
        )}

        {/* 查看充值紀錄區塊 */}
        <div className="mt-10">
        <h3 className="text-lg font-semibold mb-2 text-white">🧑‍💻 充值申請紀錄（模擬）</h3>
        <table className="w-full border border-slate-600 text-sm bg-slate-800">
          <thead className="bg-slate-700">
            <tr>
              <th className="border border-slate-600 px-2 py-1 text-white">姓名</th>
              <th className="border border-slate-600 px-2 py-1 text-white">聯絡方式</th>
              <th className="border border-slate-600 px-2 py-1 text-white">時間</th>
              <th className="border border-slate-600 px-2 py-1 text-white">截圖</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={i}>
                <td className="border border-slate-600 px-2 py-1 text-slate-300">{r.name}</td>
                <td className="border border-slate-600 px-2 py-1 text-slate-300">{r.contact}</td>
                <td className="border border-slate-600 px-2 py-1 text-slate-300">{r.time}</td>
                <td className="border border-slate-600 px-2 py-1">
                  <img src={r.img} alt="截圖" className="w-20 h-auto rounded" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
