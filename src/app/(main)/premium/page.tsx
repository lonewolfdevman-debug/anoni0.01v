'use client'

import { Crown, Check, Zap, Shield, EyeOff, Star } from 'lucide-react'

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: '₦500',
    period: '/month',
    color: 'border-border',
    badge: null,
    features: [
      'Unlimited anonymous posts',
      'Follow up to 100 creators',
      'Basic live streaming',
      'Standard quality media',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₦2,000',
    period: '/month',
    color: 'border-primary',
    badge: 'Most Popular',
    features: [
      'Everything in Basic',
      'Unlock premium creator content',
      'HD live streaming',
      'Priority in feeds',
      'Anonymous tip sending',
      'Extended media uploads',
    ],
  },
  {
    id: 'creator',
    name: 'Creator',
    price: '₦5,000',
    period: '/month',
    color: 'border-violet-DEFAULT',
    badge: 'For Creators',
    features: [
      'Everything in Premium',
      'Monetize your content',
      'Set subscription prices',
      'Revenue analytics',
      'Creator badge',
      'Priority support',
    ],
  },
]

export default function PremiumPage() {
  return (
    <div className="w-full max-w-[800px] mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <Crown className="text-gold mx-auto mb-3" size={36} />
        <h1 className="text-3xl font-black text-white mb-2">Go Premium</h1>
        <p className="text-text-secondary">Unlock the full Anoni experience</p>
      </div>

      {/* Features highlight */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {[
          { icon: <EyeOff size={18} />, label: 'Full Anonymity' },
          { icon: <Zap size={18} />, label: 'Priority Access' },
          { icon: <Shield size={18} />, label: 'Privacy First' },
          { icon: <Star size={18} />, label: 'Creator Tools' },
        ].map(f => (
          <div key={f.label} className="bg-bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-2 text-center">
            <span className="text-primary">{f.icon}</span>
            <span className="text-white text-xs font-semibold">{f.label}</span>
          </div>
        ))}
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`bg-bg-card border-2 ${plan.color} rounded-3xl p-6 flex flex-col relative`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                {plan.badge}
              </div>
            )}
            <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
            <div className="flex items-end gap-1 mb-4">
              <span className="text-3xl font-black text-white">{plan.price}</span>
              <span className="text-text-muted text-sm mb-1">{plan.period}</span>
            </div>

            <ul className="space-y-2.5 flex-1 mb-6">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                  <Check size={15} className="text-success flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90 ${
                plan.id === 'premium'
                  ? 'bg-purple-gradient text-white'
                  : 'bg-bg-elevated border border-border text-white hover:border-primary/50'
              }`}
            >
              Get {plan.name}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-text-muted text-xs mt-6">
        Payments powered by Paystack · Cancel anytime · No hidden fees
      </p>
    </div>
  )
}
