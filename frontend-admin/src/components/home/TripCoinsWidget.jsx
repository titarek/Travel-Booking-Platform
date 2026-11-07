import { useState } from 'react';
import { Coins, Check } from 'lucide-react';

export const TripCoinsWidget = () => {
  const [spendAmount, setSpendAmount] = useState(25000);

  // 100 coins per ৳10,000 spend, each 100 coins = ৳100 off
  const earnedCoins = Math.floor((spendAmount / 1000) * 10);
  const discountAmount = earnedCoins; // 1 Coin = ৳1 discount

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Headline & Information */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider text-amber-100">
            <Coins className="h-4 w-4 text-amber-200" />
            <span>TripCoins Loyalty Club</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black leading-tight drop-shadow-sm">
            Earn TripCoins on Every Booking. <br />
            <span className="text-amber-100">Save Instantly on Your Next Trip!</span>
          </h3>

          <p className="text-xs sm:text-sm text-amber-50/90 leading-relaxed max-w-xl">
            Every flight, hotel, or tour booking automatically deposits TripCoins directly into your account.
            Use coins to reduce ticket fares or enjoy complimentary baggage and lounge access.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-amber-100 pt-1">
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-white" /> 1 TripCoin = ৳1 Instant Cash Discount
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-white" /> Never Expire
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-white" /> Zero Minimum Threshold
            </span>
          </div>
        </div>

        {/* Right Side: Interactive Rewards Calculator */}
        <div className="lg:col-span-5 bg-white text-slate-900 p-6 rounded-2xl shadow-2xl border border-amber-200/50 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Reward Calculator
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-black border border-amber-200">
              Interactive
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Your Estimated Trip Spend:</span>
              <span className="text-sm font-black text-brand-600">৳ {spendAmount.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="5000"
              max="150000"
              step="5000"
              value={spendAmount}
              onChange={(e) => setSpendAmount(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
              <span>৳ 5,000</span>
              <span>৳ 75,000</span>
              <span>৳ 1,50,000</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">TripCoins Earned</span>
              <span className="text-xl font-black text-amber-600 flex items-center gap-1 mt-0.5">
                <Coins className="h-4 w-4 text-amber-500 shrink-0" />
                +{earnedCoins.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Instant Savings Value</span>
              <span className="text-xl font-black text-emerald-600 mt-0.5 block">
                ৳ {discountAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center">
            Coins are credited immediately upon booking completion.
          </p>
        </div>
      </div>

      {/* Background Decorative Coins */}
      <Coins className="absolute -bottom-10 -right-10 h-64 w-64 text-white/10 pointer-events-none" />
    </div>
  );
};
