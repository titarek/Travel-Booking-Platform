import { CreditCard, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

export const BankPartnersSection = ({ offers = [] }) => {
  const defaultPartners = [
    {
      id: 'ebl-visa',
      _id: 'ebl-visa',
      title: 'EBL Visa Travel Lifestyle Card',
      subtitle: 'Exclusive 0% EMI up to 12 months & Balaka Lounge Access',
      discount: 'Up to 15% OFF',
      tag: 'Co-Branded',
      gradient: 'from-blue-700 via-indigo-700 to-slate-900',
      iconColor: 'text-sky-300',
      features: ['0% Interest EMI up to 12 Months', 'Complimentary Balaka Executive Lounge', 'Extra 2x TripCoins per transaction'],
    },
    {
      id: 'bkash-offer',
      _id: 'bkash-offer',
      title: 'bKash Instant Cash Back',
      subtitle: 'Pay seamlessly with bKash and get instant cashback on all domestic routes',
      discount: '৳ 2,000 Cashback',
      tag: 'Instant Rebate',
      gradient: 'from-pink-600 via-rose-600 to-purple-800',
      iconColor: 'text-pink-200',
      features: ['Valid on Biman, US-Bangla, Air Astra', 'Instant credit to bKash wallet', 'No promo code needed at checkout'],
    },
    {
      id: 'city-amex',
      _id: 'city-amex',
      title: 'City Bank American Express',
      subtitle: 'Premium travel privileges, priority check-in and curated resort stays',
      discount: '12% OFF Hotels',
      tag: 'Platinum Partner',
      gradient: 'from-slate-800 via-sky-900 to-blue-900',
      iconColor: 'text-amber-300',
      features: ['City Bank Amex Lounge at Hazrat Shahjalal Intl', 'Free Room Upgrade at 5-Star Partner Resorts', 'Overseas Travel Medical Insurance'],
    },
  ];

  const partners = offers && offers.length > 0 ? offers : defaultPartners;

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-brand-500" />
            <span>Bank Partner & Lifestyle Card Privileges</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enjoy exclusive cardholder discounts, 0% EMI installments, and airport lounge vouchers
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Verified Banking Partnerships</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {partners.map((partner) => (
          <div
            key={partner._id || partner.id}
            className={`p-6 rounded-3xl bg-gradient-to-br ${partner.gradient} text-white relative overflow-hidden shadow-xl flex flex-col justify-between space-y-6 group hover:-translate-y-1 transition-all duration-300`}
          >
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-white">
                  {partner.tag}
                </span>
                <span className="text-sm font-black text-amber-300 bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/20">
                  {partner.discount}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black leading-snug">{partner.title}</h3>
                <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">{partner.subtitle}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                {partner.features.map((feat) => (
                  <p key={feat} className="text-xs text-slate-200 flex items-center gap-2">
                    <Sparkles className={`h-3.5 w-3.5 ${partner.iconColor} shrink-0`} />
                    <span>{feat}</span>
                  </p>
                ))}
              </div>
            </div>

            <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-medium">Valid until Dec 2026</span>
              <span className="text-xs font-bold text-white flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>View Details</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>

            <CreditCard className="absolute -bottom-8 -right-8 h-40 w-40 text-white/5 group-hover:scale-110 transition-transform pointer-events-none" />
          </div>
        ))}
      </div>
    </section>
  );
};
