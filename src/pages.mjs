import { esc, field, row, formCard, hero, steps, faq, faqJsonLd, trust, finalCta, media, destGallery, I } from './ui.mjs';

/* ---------------- shared option lists ---------------- */
const HOTEL_DESTS = ['دبي', 'أبوظبي', 'الدوحة', 'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'القاهرة', 'شرم الشيخ', 'إسطنبول', 'طرابزون', 'لندن', 'باريس', 'ميلانو', 'جنيف', 'تبليسي', 'باكو', 'المالديف', 'بالي', 'بانكوك', 'كوالالمبور'];
const AIRPORTS = ['الكويت (KWI)', 'الرياض (RUH)', 'جدة (JED)', 'الدمام (DMM)', 'المدينة المنورة (MED)', 'دبي (DXB)', 'أبوظبي (AUH)', 'الشارقة (SHJ)', 'الدوحة (DOH)', 'البحرين (BAH)', 'مسقط (MCT)', 'القاهرة (CAI)', 'الإسكندرية (HBE)', 'عمّان (AMM)', 'بغداد (BGW)', 'البصرة (BSR)', 'إسطنبول (IST)', 'لندن (LHR)', 'باريس (CDG)', 'بيروت (BEY)', 'باكو (GYD)', 'تبليسي (TBS)', 'كوالالمبور (KUL)', 'بانكوك (BKK)', 'ماليه – المالديف (MLE)'];
const HONEY_DESTS = ['المالديف', 'بالي', 'سانتوريني – اليونان', 'باريس', 'إسطنبول', 'موريشيوس', 'سيشل', 'بوكيت – تايلاند', 'زنجبار', 'جورجيا', 'تركيا', 'سويسرا', 'إيطاليا', 'اليونان'];
const STARS = [['3', '3 نجوم'], ['4', '4 نجوم'], ['5', '5 نجوم'], ['any', 'لا يهم']];
const CABIN = [['economy', 'الدرجة الاقتصادية'], ['premium', 'الاقتصادية الممتازة'], ['business', 'درجة رجال الأعمال'], ['first', 'الدرجة الأولى']];
const name = (f) => field(f, { type: 'text', name: 'name', label: 'الاسم', msg: 'الاسم', autocomplete: 'name', placeholder: 'كيف نناديك؟', full: true, optionalTag: true });
const notes = (f, ph) => field(f, { type: 'textarea', name: 'notes', label: 'ملاحظات إضافية', msg: 'ملاحظات', placeholder: ph, full: true });
const stack = (...h) => `<div class="f-grid">${h.join('')}</div>`;

const paymentFaq = (ctx) => ['ما طرق الدفع المتاحة؟', `يوضّح لك فريقنا طرق الدفع المعتمدة عند تأكيد الحجز. ${ctx.ph('', 'طرق الدفع المعتمدة لدى الفنار — بانتظار التأكيد')}`];
const hoursFaq = (ctx) => ['متى يردّ الفريق على طلبي؟', `نرد على الرسائل في نفس محادثة واتساب خلال ساعات العمل: ${ctx.ph(ctx.cfg.contact.workingHoursAr, 'ساعات العمل الرسمية')}. تأكد أنك ضغطت «إرسال» داخل واتساب حتى يصلنا الطلب.`];

const TRUST_ITEMS = (ctx) => [
  ['lock', 'لا دفع عبر هذه الصفحة', 'النموذج يجهّز رسالة فقط؛ لا نطلب بيانات بطاقة أو أي دفعة من خلال الموقع.'],
  ['edit', 'أنت تراجع قبل الإرسال', 'ترى نص الرسالة كاملاً في واتساب وتقدر تعدّله قبل أن تضغط «إرسال».'],
  ['chat', 'محادثة واحدة للمتابعة', `طلبك ورقمه في محادثة واتساب واحدة مع فريق ${esc(ctx.cfg.brand.nameAr)} لكل الأسئلة والتعديلات.`],
  ['shield', 'بيانات بقدر الحاجة', 'لا نطلب رقم جواز سفر أو هوية في مرحلة الاستفسار.']
];

/* =========================================================
   HOTELS — primary Google Ads landing page
   ========================================================= */
export function hotels(ctx) {
  const F = 'f-hotels';
  const offers = ctx.cfg.services.hotelOffers || [];
  const page = {
    route: '/hotels', service: 'hotels', form: true,
    title: 'حجز فنادق | خيارات إقامة تناسبك – الفنار للسياحة',
    description: 'حجز فندق لرحلتك القادمة: أرسل المدينة وتواريخ الإقامة وعدد الضيوف وميزانيتك لليلة، ويرسل لك فريق الفنار للسياحة خيارات فنادق مناسبة عبر واتساب.',
    cta: 'اطلب خيارات الفنادق عبر واتساب', ctaShort: 'اطلب خيارات الفنادق',
    heroPreload: 'hotels/hero-room'
  };
  const required = [
    stack(field(F, { type: 'text', name: 'destination', label: 'الوجهة (المدينة)', msg: 'الوجهة', required: true, list: HOTEL_DESTS, placeholder: 'مثال: دبي، إسطنبول، لندن', full: true })),
    row(F, [
      { type: 'date', name: 'checkin', label: 'تاريخ الدخول', required: true, minToday: true },
      { type: 'date', name: 'checkout', label: 'تاريخ الخروج', required: true, minToday: true, after: 'checkin', nightsFrom: 'checkin' }
    ]),
    row(F, [
      { type: 'counter', name: 'adults', label: 'البالغون', msg: 'عدد البالغين', min: 1, max: 20, value: 2 },
      { type: 'counter', name: 'children', label: 'الأطفال', msg: 'عدد الأطفال', min: 0, max: 10, value: 0 },
      { type: 'counter', name: 'rooms', label: 'الغرف', msg: 'عدد الغرف', min: 1, max: 10, value: 1 }
    ], 3),
    stack(
      field(F, { type: 'text', name: 'childAges', label: 'أعمار الأطفال', msg: 'أعمار الأطفال', showWhen: 'children>0', placeholder: 'مثال: 4 و 9 سنوات', hint: 'تساعد في معرفة سياسة الفندق وسعر الأطفال', full: true }),
      field(F, { type: 'budget', name: 'budget', label: 'الميزانية التقريبية لليلة', msg: 'الميزانية لليلة', required: true, unitSuffix: 'لليلة', hint: 'لكل الغرف معاً — اختر العملة أو «مرنة»', full: true }),
      field(F, { type: 'radio', name: 'stars', label: 'تصنيف الفندق', msg: 'التصنيف', required: true, seg: true, value: 'any', options: STARS, full: true })
    )
  ];
  const optional = [
    stack(
      field(F, { type: 'select', name: 'roomType', label: 'نوع الغرفة', msg: 'نوع الغرفة', placeholder: 'اختر (اختياري)', options: [['standard', 'غرفة عادية / مزدوجة'], ['family', 'غرفة عائلية'], ['connecting', 'غرف متصلة'], ['suite', 'جناح'], ['any', 'لا يهم']], full: true }),
      field(F, { type: 'radio', name: 'breakfast', label: 'الإفطار', msg: 'الإفطار', options: [['with', 'يشمل الإفطار'], ['without', 'بدون إفطار'], ['any', 'لا يهم']], full: true }),
      field(F, { type: 'text', name: 'location', label: 'الموقع المفضّل', msg: 'الموقع المفضّل', placeholder: 'مثال: وسط المدينة، قريب من البحر أو من مكان فعالية', full: true }),
      field(F, { type: 'text', name: 'hotelName', label: 'فندق محدد (إن وُجد)', msg: 'فندق محدد', placeholder: 'اكتب اسم الفندق إذا عندك فندق في بالك', full: true }),
      notes(F, 'مثال: سرير إضافي، طابق مرتفع، وصول متأخر'),
      name(F)
    )
  ];
  const form = formCard(ctx, { id: F, service: 'hotels', serviceLabel: 'حجز فندق', prefix: 'H', title: 'اطلب خيارات الفنادق', sub: 'املأ التفاصيل ونجهّز لك رسالة واتساب كاملة', required, optional, cta: page.cta });

  const faqs = [
    ['كيف أطلب حجز فندق عن طريق الفنار للسياحة؟', 'املأ النموذج أعلى الصفحة: المدينة، تاريخ الدخول والخروج، عدد الضيوف والغرف، والميزانية التقريبية لليلة. عند الضغط على الزر يُفتح واتساب برسالة جاهزة؛ راجعها ثم اضغط «إرسال»، ويرد عليك فريقنا بالخيارات المتاحة في نفس المحادثة.'],
    ['هل توجد أسعار فنادق ثابتة على الصفحة؟', 'لا. أسعار الفنادق تتغير حسب التاريخ والتوفر ونوع الغرفة وسياسة السعر، لذلك لا نعرض أسعاراً ثابتة. نرسل لك الأسعار المتاحة وقت طلبك عبر واتساب.'],
    ['هل يتم الحجز بمجرد إرسال النموذج؟', 'لا. الرسالة طلب خيارات فقط. لا يتم أي حجز أو دفع قبل أن تختار الخيار المناسب وتوافق على تفاصيله وشروطه مع فريقنا.'],
    ['ماذا عن الإلغاء أو تغيير التواريخ؟', 'شروط الإلغاء والتعديل تختلف من فندق لآخر وحسب نوع السعر (قابل للاسترداد أو غير قابل للاسترداد). اسأل فريقنا عن شروط كل خيار قبل التأكيد.'],
    ['هل أقدر أطلب فندقاً معيّناً بالاسم؟', 'نعم. افتح «أضف تفضيلاتك» واكتب اسم الفندق في خانة «فندق محدد»، وسيتحقق الفريق من توفره في تواريخك.'],
    ['ماذا تعني الميزانية لليلة؟', 'هي المبلغ التقريبي الذي تفضّل ألا تتجاوزه لليلة الواحدة لكل الغرف معاً، بالعملة التي تختارها. إذا لم تكن متأكداً اختر «مرنة».'],
    paymentFaq(ctx),
    hoursFaq(ctx)
  ];
  page.jsonld = [faqJsonLd(faqs)];

  const offersSection = offers.length
    ? `<section class="section section--tight" aria-labelledby="offers-h"><div class="container"><div class="section-head"><h2 id="offers-h">عروض فنادق متاحة حالياً</h2><p>عروض على الفنادق موثّقة وبتاريخ صلاحية واضح. الأسعار والتوفر يتم تأكيدها عند الطلب.</p></div><div class="offers">${offers.map((o) => `<article class="offer"><h3>${esc(o.titleAr)}</h3><p>${esc(o.detailsAr)}</p><small>ساري حتى ${esc(o.validUntil)} · ${esc(o.termsAr)}</small></article>`).join('')}</div></div></section>`
    : ctx.cfg.showPlaceholders
      ? `<section class="section section--tight" aria-label="ملاحظة للفريق"><div class="container"><div class="ph-block"><strong>قسم «عروض فنادق» مخفي تلقائياً.</strong> يظهر فقط عند إضافة عروض حقيقية قابلة للإثبات (اسم العرض، التفاصيل، تاريخ الصلاحية، الشروط) في <code>site.config.json → services.hotelOffers</code>. لا تُستخدم عبارة «عروض على الفنادق» بدون عرض موثّق.</div></div></section>`
      : '';

  const body = `
${hero(ctx, {
    eyebrow: 'حجوزات الفنادق — ' + esc(ctx.cfg.brand.nameAr),
    h1: 'حجز فنادق <span class="accent">يناسب وجهتك وميزانيتك</span>',
    lead: 'تدور على حجز فندق لرحلتك القادمة؟ مع الفنار للسياحة، أرسل لنا المدينة وتواريخ الإقامة وعدد الضيوف والميزانية، وفريقنا يساعدك في الحصول على خيارات فنادق تناسب احتياجك.',
    points: [['pin', 'الموقع الذي يناسب برنامجك'], ['star', 'التصنيف الذي تفضّله'], ['bed', 'نوع وعدد الغرف حسب ضيوفك']],
    assure: ['بدون دفع عبر الموقع', 'تراجع الرسالة قبل إرسالها', 'الميزانية بالعملة التي تناسبك'],
    mediaOpts: { file: 'hotels/hero-room', alt: 'جناح فندقي بسرير مزدوج وإطلالة على أفق المدينة', icon: 'bed', need: 'غرفة فندقية (Hero)', pos: '80% 55%', posMobile: '78% 55%' },
    formHtml: form
  })}

${steps('كيف نساعدك في حجوزات الفنادق؟', 'ثلاث خطوات بسيطة من الطلب إلى التأكيد — وأنت المتحكم في كل خطوة.', [
    ['list', 'أرسل تفاصيل الإقامة', 'المدينة، تاريخ الدخول والخروج، عدد الضيوف والغرف، والميزانية التقريبية لليلة.'],
    ['chat', 'نرسل لك الخيارات على واتساب', 'يراجع فريقنا طلبك ويرسل لك خيارات فنادق متاحة تناسب تفاصيلك وميزانيتك.'],
    ['check', 'تختار وتؤكد', 'تقارن وتسأل عن الشروط، ولا يتم أي حجز إلا بعد موافقتك.']
  ])}

<section class="section section--sand" aria-labelledby="stay-h">
  <div class="container">
    <div class="section-head"><h2 id="stay-h">حدّد الإقامة التي تناسبك</h2><p>كل تفصيل تذكره في الطلب يساعدنا نرسل لك خيارات حجز فندق أقرب لما تريده من أول مرة.</p></div>
    <div class="cards cards--scroll">
      <article class="card">${media(ctx, { file: 'hotels/lobby', alt: 'ردهة استقبال فندق بإضاءة دافئة وزخارف عربية', icon: 'lobby', need: 'ردهة فندق', ar: '4/3', pos: '72% 55%' })}<h3 class="card__cap">${I.lobby}الموقع والمرافق</h3><div class="card__body"><p>وسط المدينة، قريب من البحر، أو قرب مكان فعالية أو تسوق — اذكر ما يهمك في خانة الموقع المفضّل.</p></div></article>
      <article class="card">${media(ctx, { file: 'hotels/hero-room', alt: 'سرير مزدوج بمفرش أزرق في غرفة فندقية', icon: 'bed', need: 'غرفة فندقية', ar: '4/3', pos: '92% 70%' })}<h3 class="card__cap">${I.bed}نوع الغرف وعددها</h3><div class="card__body"><p>غرفة عادية، غرف متصلة للعائلة أو جناح — حدّد عدد الغرف والضيوف وأعمار الأطفال.</p></div></article>
      <article class="card">${media(ctx, { file: 'hotels/breakfast', alt: 'طاولة إفطار في مطعم فندق مع بوفيه وإطلالة على المدينة', icon: 'coffee', need: 'إفطار فندق', ar: '4/3', pos: '55% 70%' })}<h3 class="card__cap">${I.coffee}الإفطار والوجبات</h3><div class="card__body"><p>اختر إن كنت تفضّل سعراً يشمل الإفطار أو بدونه، وسنوضح لك ما يشمله كل خيار.</p></div></article>
    </div>
  </div>
</section>

${offersSection}

<section class="section" aria-labelledby="tips-h">
  <div class="container split">
    ${media(ctx, { file: 'hotels/hero-room', alt: 'نافذة غرفة فندقية مطلة على البحر وأفق المدينة', icon: 'bed', need: 'غرفة فندقية', ar: '5/4', pos: '64% 45%' })}
    <div>
      <h2 id="tips-h">نصائح قبل طلب حجز الفندق</h2>
      <p class="muted" style="color:var(--muted)">معلومات بسيطة توفّر عليك رسائل كثيرة وتختصر وقت الوصول للخيار المناسب.</p>
      <ul class="checklist">
        <li>${I.calendar}<div><b>هل تواريخك مرنة؟</b><span>تغيير يوم واحد أحياناً يفتح خيارات أكثر — اذكر ذلك في الملاحظات.</span></div></li>
        <li>${I.wallet}<div><b>الميزانية لليلة وليس للرحلة</b><span>اكتب المبلغ التقريبي لليلة الواحدة لكل الغرف، أو اختر «مرنة».</span></div></li>
        <li>${I.pin}<div><b>ما الأهم لك في الموقع؟</b><span>القرب من مكان معيّن أهم من اسم المنطقة أحياناً.</span></div></li>
        <li>${I.users}<div><b>أعمار الأطفال</b><span>سياسة الأطفال والأسرّة الإضافية تختلف من فندق لآخر.</span></div></li>
      </ul>
      <p style="margin-top:22px"><a class="btn" href="#booking" data-cta="tips">${I.whatsapp}<span>اطلب خيارات الفنادق</span></a></p>
    </div>
  </div>
</section>

${trust(ctx, 'لماذا تطلب حجز فندقك عبر الفنار؟', TRUST_ITEMS(ctx))}
${faq('faq', 'أسئلة شائعة عن حجز الفنادق', faqs, media(ctx, { file: 'hotels/lobby', alt: 'ركن جلوس في ردهة فندق', icon: 'lobby', need: 'ردهة فندق', ar: '4/5', pos: '82% 60%' }))}
${finalCta('جاهز تبدأ حجز الفندق؟', 'أرسل التفاصيل الآن ورقم طلبك يكون معك في رسالة واتساب.', 'اطلب خيارات الفنادق عبر واتساب')}
`;
  return { page, body };
}

/* =========================================================
   FLIGHTS
   ========================================================= */
export function flights(ctx) {
  const F = 'f-flights';
  const page = {
    route: '/flights', service: 'flights', form: true,
    title: 'تذاكر طيران | اطلب خيارات رحلتك – الفنار للسياحة',
    description: 'اطلب تذاكر طيران من أي مدينة إلى وجهتك: حدّد نوع الرحلة والتواريخ وعدد المسافرين ودرجة السفر، ويرسل لك فريق الفنار للسياحة الخيارات المتاحة عبر واتساب.',
    cta: 'اطلب خيارات تذاكر الطيران', ctaShort: 'اطلب خيارات الطيران', heroPreload: 'flights/hero-airport'
  };
  const required = [
    stack(field(F, { type: 'radio', name: 'tripType', label: 'نوع الرحلة', required: true, seg: true, value: 'return', options: [['return', 'ذهاب وعودة'], ['oneway', 'ذهاب فقط'], ['multi', 'وجهات متعددة']], full: true })),
    row(F, [
      { type: 'text', name: 'origin', label: 'من', msg: 'من', required: true, list: AIRPORTS, placeholder: 'مدينة أو مطار المغادرة', icon: 'plane' },
      { type: 'text', name: 'destination', label: 'إلى', msg: 'إلى', required: true, list: AIRPORTS, placeholder: 'مدينة أو مطار الوصول', icon: 'pin' }
    ]),
    row(F, [
      { type: 'date', name: 'depart', label: 'تاريخ الذهاب', required: true, minToday: true },
      { type: 'date', name: 'return', label: 'تاريخ العودة', required: true, minToday: true, onOrAfter: 'depart', showWhen: 'tripType=return' }
    ]),
    stack(field(F, { type: 'textarea', name: 'multiRoute', label: 'المسار والتواريخ', msg: 'تفاصيل المسار', required: true, showWhen: 'tripType=multi', placeholder: 'مثال: لندن ← باريس 15/1، باريس ← الكويت 20/1', hint: 'اكتب كل رحلة إضافية بعد الرحلة الأولى أعلاه', full: true })),
    row(F, [
      { type: 'counter', name: 'adults', label: 'البالغون', msg: 'البالغون', min: 1, max: 9, value: 1, hint: '12 سنة فأكثر' },
      { type: 'counter', name: 'children', label: 'الأطفال', msg: 'الأطفال', min: 0, max: 8, value: 0, hint: '2–11 سنة' },
      { type: 'counter', name: 'infants', label: 'الرضّع', msg: 'الرضّع', min: 0, max: 9, value: 0, hint: 'أقل من سنتين', maxOf: 'adults' }
    ], 3),
    stack(field(F, { type: 'select', name: 'cabin', label: 'درجة السفر', required: true, value: 'economy', options: CABIN, full: true }))
  ];
  const optional = [
    stack(
      field(F, { type: 'budget', name: 'budget', label: 'الميزانية التقريبية لكل المسافرين', msg: 'الميزانية', unitSuffix: 'إجمالي', full: true }),
      field(F, { type: 'radio', name: 'dateFlex', label: 'مرونة التواريخ', msg: 'مرونة التواريخ', options: [['fixed', 'تواريخ ثابتة'], ['flex3', 'مرنة ± 3 أيام']], full: true }),
      field(F, { type: 'text', name: 'airline', label: 'شركة طيران مفضّلة', msg: 'شركة الطيران المفضّلة', placeholder: 'اختياري', full: true }),
      field(F, { type: 'radio', name: 'baggage', label: 'الأمتعة', msg: 'الأمتعة', options: [['carry', 'حقيبة يد فقط'], ['checked', 'حقيبة مشحونة'], ['any', 'لا يهم']], full: true }),
      field(F, { type: 'single-check', name: 'directOnly', label: 'رحلات مباشرة فقط', msg: 'رحلات مباشرة فقط', full: true }),
      field(F, { type: 'single-check', name: 'loyalty', label: 'لدي عضوية برنامج مسافر دائم (أذكر التفاصيل لاحقاً)', msg: 'عضوية برنامج مسافر دائم', full: true }),
      notes(F, 'مثال: وقت مفضّل للإقلاع، مقعد بجانب النافذة'),
      name(F)
    )
  ];
  const form = formCard(ctx, { id: F, service: 'flights', serviceLabel: 'طلب تذاكر طيران', prefix: 'F', title: 'اطلب خيارات تذاكر الطيران', sub: 'حدّد المسار والتواريخ والمسافرين', required, optional, cta: page.cta });
  const faqs = [
    ['كيف أطلب تذاكر طيران؟', 'اختر نوع الرحلة، واكتب من وإلى والتواريخ وعدد المسافرين ودرجة السفر، ثم اضغط زر واتساب. راجع الرسالة الجاهزة واضغط «إرسال»، ويرسل لك فريقنا الخيارات المتاحة.'],
    ['هل أسعار التذاكر ثابتة؟', 'لا. أسعار الطيران تتغير بسرعة حسب التوفر والموعد. السعر الذي نرسله لك هو المتاح وقت الطلب، ويتم تأكيده عند إصدار التذكرة.'],
    ['هل تُصدر التذكرة بمجرد إرسال الطلب؟', 'لا. إرسال الرسالة طلب خيارات فقط، ولا يتم الحجز أو الإصدار إلا بعد موافقتك على الخيار وتفاصيله.'],
    ['هل أحتاج بيانات جواز السفر الآن؟', 'لا. لا نطلب بيانات جواز السفر في هذا النموذج. تُطلب بيانات المسافرين فقط عند تأكيد الحجز.'],
    ['ماذا عن الأمتعة وتغيير الموعد؟', 'سياسة الأمتعة والتغيير والإلغاء تختلف حسب شركة الطيران ونوع التذكرة. اسأل فريقنا عن شروط كل خيار قبل التأكيد.'],
    ['هل يمكن طلب رحلة متعددة الوجهات؟', 'نعم. اختر «وجهات متعددة» واكتب الرحلة الأولى في الخانات، ثم باقي المسار والتواريخ في الخانة المخصصة.'],
    paymentFaq(ctx),
    hoursFaq(ctx)
  ];
  page.jsonld = [faqJsonLd(faqs)];
  const body = `
${hero(ctx, {
    eyebrow: 'تذاكر الطيران — ' + esc(ctx.cfg.brand.nameAr),
    h1: 'تذاكر طيران لوجهتك القادمة، <span class="accent">بخيارات تناسب رحلتك</span>',
    lead: 'رحلة عمل أو إجازة عائلية أو سفر متكرر — أرسل لنا المسار والتواريخ وعدد المسافرين ودرجة السفر، ونرسل لك خيارات الرحلات المتاحة على واتساب.',
    points: [['route', 'ذهاب وعودة أو وجهات متعددة'], ['seat', 'الدرجة التي تناسبك'], ['suitcase', 'تفضيلات الأمتعة والطيران']],
    assure: ['بدون دفع عبر الموقع', 'لا نطلب بيانات الجواز الآن', 'تراجع الرسالة قبل إرسالها'],
    mediaOpts: { file: 'flights/hero-airport', alt: 'مسافر ينتظر في صالة المطار وطائرة على المدرج خلف الزجاج', icon: 'plane', need: 'مسافر في المطار (Hero)', pos: '74% 50%', posMobile: '72% 50%' },
    formHtml: form
  })}
${steps('كيف تطلب تذاكر الطيران؟', 'من التفاصيل إلى الخيارات في محادثة واحدة.', [
    ['route', 'حدّد الرحلة', 'نوع الرحلة، من وإلى، التواريخ، عدد المسافرين ودرجة السفر.'],
    ['chat', 'تصلك الخيارات', 'يرسل لك فريقنا رحلات متاحة تناسب طلبك على واتساب.'],
    ['check', 'تختار ونؤكد', 'تراجع التوقيت والشروط، ولا يتم الحجز إلا بعد موافقتك.']
  ])}
${destGallery(ctx, { id: 'destinations', title: 'وجهات تستاهل تكون رحلتك الجاية', sub: 'اختر وجهة وننقلها مباشرة إلى طلب تذاكر الطيران، أو اكتب أي وجهة أخرى في النموذج.', items: [
    { key: 'dubai', file: 'destinations/dubai-sunset-waterfront-dining', name: 'دبي', value: 'دبي (DXB)', category: 'مدن', meta: '<span lang="en">DXB</span> · الإمارات', desc: 'برج خليفة والواجهات البحرية والأسواق الكبرى، وجهة مناسبة للعائلات والتسوق والإجازات القصيرة.', alt: 'أفق دبي وبرج خليفة عند الغروب من مطعم على الواجهة البحرية', pos: '62% 50%' },
    { key: 'istanbul', file: 'destinations/istanbul-sunset-rooftop-blue-mosque', name: 'إسطنبول', value: 'إسطنبول (IST)', category: 'مدن وتاريخ', meta: '<span lang="en">IST</span> · تركيا', desc: 'الجامع الأزرق ومضيق البوسفور والأسواق القديمة، مزيج بين التاريخ وحياة المدينة الحديثة.', alt: 'الجامع الأزرق ومضيق البوسفور عند الغروب من شرفة في إسطنبول', pos: '70% 45%' },
    { key: 'paris', file: 'destinations/paris-golden-hour-balcony-panorama', name: 'باريس', value: 'باريس (CDG)', category: 'مدن', meta: '<span lang="en">CDG</span> · فرنسا', desc: 'برج إيفل ونهر السين والمتاحف والمقاهي، وجهة كلاسيكية لمحبي المدن الأوروبية.', alt: 'برج إيفل ونهر السين عند الغروب من شرفة في باريس', pos: '72% 45%' }
  ] })}
<section class="section section--sand" aria-labelledby="freq-h">
  <div class="container split">
    <div>
      <h2 id="freq-h">تسافر كثيراً؟ وفّر وقتك في كل طلب</h2>
      <p style="color:var(--muted)">أضف تفضيلاتك مرة واحدة في الطلب، ويتم أخذها في الاعتبار عند البحث عن الخيارات.</p>
      <ul class="checklist">
        <li>${I.plane}<div><b>شركة الطيران المفضّلة</b><span>اذكرها إذا كنت تفضّل شركة معيّنة.</span></div></li>
        <li>${I.route}<div><b>رحلات مباشرة فقط</b><span>فعّل الخيار إذا لا تريد توقفات.</span></div></li>
        <li>${I.calendar}<div><b>مرونة ± 3 أيام</b><span>المرونة في التاريخ قد تفتح خيارات أكثر.</span></div></li>
        <li>${I.star}<div><b>برامج المسافر الدائم</b><span>أخبرنا أن لديك عضوية، وتذكر التفاصيل لاحقاً عند التأكيد.</span></div></li>
      </ul>
    </div>
    <div class="collage collage--2">${media(ctx, { file: 'flights/traveler-thobe-terminal', alt: 'مسافر بالثوب والشماغ يجر حقيبته في صالة المطار عند الغروب', icon: 'suitcase', need: 'مسافر', ar: '3/4', pos: '50% 45%' })}<a class="collage__ad" href="#booking" data-cta="flights_ad_creative" aria-label="وين ودك تسافر؟ استكشف رحلتك القادمة مع الفنار — انتقل إلى نموذج الطلب">${media(ctx, { file: 'flights/ad-where-to-travel', alt: 'إعلان الفنار للسياحة والسفر: وين ودك تسافر؟ استكشف رحلتك القادمة مع الفنار بلمسة راقية ومريحة', icon: 'plane', need: 'إعلان', ar: '3/4', pos: '50% 50%' })}</a></div>
  </div>
</section>
${trust(ctx, 'اطلب تذكرتك بثقة', TRUST_ITEMS(ctx))}
${faq('faq', 'أسئلة شائعة عن تذاكر الطيران', faqs, media(ctx, { file: 'flights/terminal-concourse-golden', alt: 'مسافرون في صالة مطار واسعة عند الغروب والطائرة على المدرج', icon: 'plane', need: 'صالة المطار', ar: '4/5', pos: '22% 50%' }))}
${finalCta('وجهتك القادمة بانتظارك', 'أرسل تفاصيل رحلتك وتصلك الخيارات في نفس المحادثة.', 'اطلب خيارات تذاكر الطيران', media(ctx, { file: 'flights/terminal-lounge-sunlit', alt: '', icon: 'plane', need: 'صالة المطار', ar: null, pos: '40% 45%', sizes: '(max-width: 900px) 100vw, 1200px' }))}
`;
  return { page, body };
}

/* =========================================================
   HONEYMOON
   ========================================================= */
export function honeymoon(ctx) {
  const F = 'f-honeymoon';
  const pk = ctx.cfg.services.honeymoonPackagesConfirmed;
  const page = {
    route: '/flights/honeymoon', service: 'honeymoon', form: true,
    title: 'رحلات شهر العسل | خطّطوا لرحلتكم – الفنار للسياحة',
    description: 'خطّطوا لرحلة شهر العسل: أرسلوا الوجهة والتواريخ وعدد الليالي والميزانية لشخصين وتفضيلاتكم، ويتواصل معكم فريق الفنار للسياحة عبر واتساب بالخيارات المناسبة.',
    cta: 'خطّط لرحلة شهر العسل', ctaShort: 'خطّط لرحلتكم', heroPreload: 'honeymoon/hero-resort'
  };
  const required = [
    stack(field(F, { type: 'radio', name: 'inquiry', label: 'نوع الطلب', required: true, value: 'package', options: [['package', 'استفسار عن رحلة متكاملة'], ['flighthotel', 'طيران + فندق'], ['flights', 'تذاكر طيران فقط']], full: true })),
    row(F, [
      { type: 'text', name: 'origin', label: 'السفر من', msg: 'السفر من', required: true, list: AIRPORTS, placeholder: 'مدينة المغادرة', icon: 'plane' },
      { type: 'text', name: 'destination', label: 'الوجهة', msg: 'الوجهة', required: true, list: HONEY_DESTS, placeholder: 'مثال: المالديف، بالي', showWhen: 'destFlexible:unchecked' }
    ]),
    stack(field(F, { type: 'single-check', name: 'destFlexible', label: 'لم نحدد الوجهة بعد — اقترحوا علينا', msg: 'الوجهة مرنة (بانتظار اقتراحات)', full: true })),
    row(F, [
      { type: 'date', name: 'depart', label: 'تاريخ السفر', required: true, minToday: true },
      { type: 'counter', name: 'nights', label: 'عدد الليالي', msg: 'عدد الليالي', min: 2, max: 30, value: 7 }
    ]),
    stack(field(F, { type: 'budget', name: 'budget', label: 'الميزانية التقريبية لشخصين', msg: 'الميزانية لشخصين', required: true, unitSuffix: 'لشخصين (إجمالي)', hint: 'إجمالي الرحلة لشخصين — اختاروا العملة أو «مرنة»', placeholder: 'مثال: 1500', full: true }))
  ];
  const optional = [
    stack(
      field(F, { type: 'checks', name: 'experience', label: 'التجربة التي تفضّلونها', msg: 'التجربة المفضّلة', options: [['beach', 'شاطئ وفلل على الماء'], ['nature', 'طبيعة وجبال'], ['city', 'مدن وتسوق'], ['adventure', 'أنشطة ومغامرات'], ['privacy', 'خصوصية وهدوء'], ['dining', 'عشاء وتجارب مميزة']], full: true }),
      field(F, { type: 'radio', name: 'stars', label: 'تصنيف الإقامة', msg: 'تصنيف الإقامة', seg: true, options: STARS, full: true }),
      field(F, { type: 'select', name: 'cabin', label: 'درجة السفر', msg: 'درجة السفر', placeholder: 'اختر (اختياري)', options: CABIN, full: true }),
      field(F, { type: 'radio', name: 'dateFlex', label: 'مرونة التواريخ', msg: 'مرونة التواريخ', options: [['fixed', 'تاريخ ثابت'], ['flex', 'مرن بعدة أيام']], full: true }),
      notes(F, 'مثال: موعد الزفاف، مفاجأة خاصة، متطلبات غذائية'),
      name(F)
    )
  ];
  const disclosure = pk ? '' : 'توفّر الرحلات المتكاملة (طيران + إقامة + أنشطة) يتم تأكيده من فريقنا حسب الوجهة والتواريخ. يمكنكم أيضاً طلب تذاكر الطيران فقط أو طيران + فندق.';
  const form = formCard(ctx, { id: F, service: 'honeymoon', serviceLabel: 'التخطيط لرحلة شهر عسل', prefix: 'HM', title: 'خطّطوا لرحلة شهر العسل', sub: 'الوجهة والتواريخ والميزانية لشخصين', required, optional, cta: page.cta, disclosure });
  const faqs = [
    ['هل تقدمون رحلات شهر عسل متكاملة؟', pk ? 'نعم، يمكنكم طلب رحلة متكاملة وسيرسل لكم فريقنا الخيارات المتاحة لوجهتكم وتواريخكم.' : 'أرسلوا استفساركم عن رحلة متكاملة، وسيوضح لكم فريقنا ما يمكن ترتيبه لوجهتكم وتواريخكم. وإذا كنتم تحتاجون الطيران فقط أو طيران + فندق، اختاروا ذلك في نوع الطلب.'],
    ['لم نحدد الوجهة بعد، هل يمكنكم الاقتراح؟', 'نعم. فعّلوا خيار «لم نحدد الوجهة بعد» واذكروا التجربة التي تفضّلونها والميزانية، وسيقترح عليكم الفريق وجهات تناسبكم.'],
    ['كيف نحدد الميزانية لشخصين؟', 'اكتبوا المبلغ الإجمالي التقريبي للرحلة لشخصين بالعملة التي تختارونها. الميزانية تتأثر بالوجهة والموسم ومستوى الإقامة، وإذا لم تكونوا متأكدين اختاروا «مرنة».'],
    ['هل يتم الحجز بمجرد إرسال الطلب؟', 'لا. الطلب استفسار فقط، ولا يتم أي حجز أو دفع قبل موافقتكم على الخيار وتفاصيله وشروطه.'],
    ['ماذا عن التأشيرات؟', 'متطلبات التأشيرة تختلف حسب الجنسية والوجهة. نوصي بالتحقق منها من المصادر الرسمية للوجهة قبل السفر.'],
    paymentFaq(ctx),
    hoursFaq(ctx)
  ];
  page.jsonld = [faqJsonLd(faqs)];
  const body = `
${hero(ctx, {
    eyebrow: 'رحلات شهر العسل — ' + esc(ctx.cfg.brand.nameAr),
    h1: 'رحلة شهر العسل <span class="accent">تبدأ بتفاصيل تناسبكم</span>',
    lead: 'شاطئ هادئ، طبيعة وجبال، أو مدينة تحبونها؟ أخبرونا بالوجهة أو اتركوها مفتوحة، مع التواريخ والميزانية لشخصين، ونساعدكم في ترتيب الخيارات المناسبة لكم.',
    points: [['palm', 'وجهة محددة أو اقتراحات'], ['heart', 'التجربة التي تحلمون بها'], ['wallet', 'ميزانية لشخصين بعملتكم']],
    assure: ['بدون دفع عبر الموقع', 'تراجعون الرسالة قبل إرسالها', 'خصوصية تفاصيلكم'],
    mediaOpts: { file: 'honeymoon/hero-resort', alt: 'طاولة عشاء لشخصين على شرفة منتجع مطلة على البحر عند الغروب', icon: 'palm', need: 'منتجع رومانسي (Hero)', pos: '52% 55%', posMobile: '50% 55%' },
    formHtml: form
  })}
${steps('كيف نخطط لرحلتكم؟', 'من الفكرة إلى الخيارات بخطوات واضحة.', [
    ['heart', 'أخبرونا بما تحبون', 'الوجهة أو نوع التجربة، التواريخ، عدد الليالي والميزانية لشخصين.'],
    ['chat', 'نقترح ونوضح', 'يرسل لكم فريقنا خيارات تناسب طلبكم، ويوضح ما يشمله كل خيار.'],
    ['check', 'تختارون بهدوء', 'تقارنون وتسألون، ولا يتم أي حجز إلا بعد موافقتكم.']
  ])}
<section class="section section--sand" aria-labelledby="exp-h">
  <div class="container split">
    ${media(ctx, { file: 'honeymoon/hero-resort', alt: 'جلسة خاصة بجانب مسبح منتجع على البحر', icon: 'heart', need: 'منتجع', ar: '5/4', pos: '80% 50%' })}
    <div>
      <h2 id="exp-h">اختاروا طابع رحلتكم</h2>
      <p style="color:var(--muted)">حدّدوا ما يهمكم في «أضف تفضيلاتك» حتى تكون الخيارات أقرب لتوقعاتكم.</p>
      <ul class="tags">
        <li>${I.sun}شاطئ وفلل على الماء</li><li>${I.palm}طبيعة وجبال</li><li>${I.pin}مدن وتسوق</li>
        <li>${I.route}أنشطة ومغامرات</li><li>${I.lock}خصوصية وهدوء</li><li>${I.star}عشاء وتجارب مميزة</li>
      </ul>
      <p style="margin-top:22px"><a class="btn" href="#booking" data-cta="experiences">${I.whatsapp}<span>خطّط لرحلة شهر العسل</span></a></p>
    </div>
  </div>
</section>
${destGallery(ctx, { id: 'destinations', title: 'وجهات شهر عسل تستاهل تعيشون تفاصيلها', sub: 'اختاروا وجهة لإضافتها إلى طلبكم، أو اكتبوا أي وجهة أخرى في النموذج.', items: [
    { key: 'maldives', file: 'destinations/maldives-overwater-villas-sunset', name: 'المالديف', value: 'المالديف', category: 'شواطئ', meta: 'المحيط الهندي', desc: 'مياه فيروزية وفلل فوق الماء وخصوصية تامة، خيار كلاسيكي لرحلات شهر العسل.', alt: 'فلل فوق الماء ومياه فيروزية صافية في المالديف', pos: '62% 50%' },
    { key: 'santorini', file: 'destinations/santorini-sunset-terrace-bougainvillea', name: 'سانتوريني', value: 'سانتوريني – اليونان', category: 'جزر', meta: 'اليونان', desc: 'قرى بيضاء وقباب زرقاء وغروب ساحر فوق بحر إيجه، مثالية للأمسيات الرومانسية.', alt: 'قباب سانتوريني الزرقاء وغروب الشمس فوق البحر من شرفة مزهرة', pos: '66% 50%' },
    { key: 'bali', file: 'destinations/bali-sunset-infinity-pool-retreat', name: 'بالي', value: 'بالي', category: 'طبيعة', meta: 'إندونيسيا', desc: 'طبيعة استوائية ومدرجات أرز ومنتجعات بين الغابات، لمن يحب الهدوء والاستجمام.', alt: 'مسبح مطل على مدرجات الأرز والبركان عند الغروب في بالي', pos: '60% 50%' },
    { key: 'paris', file: 'destinations/paris-golden-hour-balcony-panorama', name: 'باريس', value: 'باريس', category: 'مدن', meta: 'فرنسا', desc: 'أمسيات على نهر السين وإطلالات برج إيفل ومقاهٍ تاريخية، لعشاق المدن الرومانسية.', alt: 'برج إيفل ونهر السين عند الغروب من شرفة في باريس', pos: '72% 45%' }
  ] })}
${trust(ctx, 'خطّطوا بثقة وهدوء', TRUST_ITEMS(ctx))}
${faq('faq', 'أسئلة شائعة عن رحلات شهر العسل', faqs, media(ctx, { file: 'honeymoon/hero-resort', alt: 'غروب الشمس على البحر من شرفة منتجع', icon: 'sun', need: 'منتجع', ar: '4/5', pos: '25% 50%' }))}
${finalCta('ابدؤوا التخطيط لرحلتكم', 'أرسلوا التفاصيل ويصلكم رقم الطلب في رسالة واتساب.', 'خطّط لرحلة شهر العسل')}
`;
  return { page, body };
}

/* =========================================================
   UMRAH
   ========================================================= */
export function umrah(ctx) {
  const F = 'f-umrah';
  const S = ctx.cfg.services;
  const page = {
    route: '/flights/umrah', service: 'umrah', form: true,
    title: 'رحلات العمرة | ترتيبات تناسب احتياجك – الفنار للسياحة',
    description: 'استفسر عن ترتيبات رحلة العمرة من مدينتك: التواريخ، عدد المسافرين، مدة الإقامة في مكة المكرمة والمدينة المنورة، احتياجات السكن والميزانية — وتواصل مع فريق الفنار للسياحة عبر واتساب.',
    cta: 'استفسر عن خيارات العمرة', ctaShort: 'استفسر عن العمرة', heroPreload: 'umrah/hero-makkah'
  };
  const services = [['flights', 'تذاكر طيران'], ['hotelMakkah', 'سكن في مكة المكرمة'], ['hotelMadinah', 'سكن في المدينة المنورة'], ['transfers', 'تنقلات (المطار / بين المدينتين)']];
  if (S.umrahVisaServiceConfirmed) services.push(['visa', 'المساعدة في التأشيرة']);
  const required = [
    row(F, [
      { type: 'text', name: 'origin', label: 'السفر من', msg: 'السفر من', required: true, list: AIRPORTS, placeholder: 'مدينة المغادرة', icon: 'plane' },
      { type: 'date', name: 'depart', label: 'تاريخ السفر', required: true, minToday: true }
    ]),
    stack(field(F, { type: 'radio', name: 'itinerary', label: 'خط سير الرحلة', msg: 'خط السير', required: true, seg: true, value: 'makkah_madinah', options: [['makkah', 'مكة فقط'], ['makkah_madinah', 'مكة ثم المدينة'], ['madinah_makkah', 'المدينة ثم مكة']], full: true })),
    row(F, [
      { type: 'counter', name: 'makkahNights', label: 'ليالي مكة المكرمة', msg: 'ليالي مكة', min: 1, max: 30, value: 4 },
      { type: 'counter', name: 'madinahNights', label: 'ليالي المدينة المنورة', msg: 'ليالي المدينة', min: 1, max: 30, value: 3, showWhen: 'itinerary=makkah_madinah|madinah_makkah' }
    ]),
    row(F, [
      { type: 'counter', name: 'adults', label: 'البالغون', msg: 'البالغون', min: 1, max: 30, value: 2 },
      { type: 'counter', name: 'children', label: 'الأطفال', msg: 'الأطفال', min: 0, max: 20, value: 0 },
      { type: 'counter', name: 'infants', label: 'الرضّع', msg: 'الرضّع', min: 0, max: 10, value: 0, maxOf: 'adults' }
    ], 3),
    stack(
      field(F, { type: 'checks', name: 'services', label: 'ما الذي تحتاجه؟', msg: 'الخدمات المطلوبة', required: true, value: ['flights', 'hotelMakkah', 'hotelMadinah'], options: services, full: true }),
      field(F, { type: 'budget', name: 'budget', label: 'الميزانية التقريبية للفرد', msg: 'الميزانية للفرد', required: true, unitSuffix: 'للفرد', hint: 'اختر العملة أو «مرنة»', placeholder: 'مثال: 350', full: true })
    )
  ];
  const optional = [
    stack(
      field(F, { type: 'radio', name: 'distance', label: 'المسافة المفضّلة من الحرم', msg: 'المسافة من الحرم', options: [['walk', 'قريب (مشياً)'], ['shuttle', 'متوسط مع مواصلات'], ['any', 'لا يهم']], full: true }),
      field(F, { type: 'radio', name: 'stars', label: 'تصنيف الفندق', msg: 'تصنيف الفندق', seg: true, options: STARS, full: true }),
      field(F, { type: 'select', name: 'roomSetup', label: 'ترتيب الغرف', msg: 'ترتيب الغرف', placeholder: 'اختر (اختياري)', options: [['double', 'غرفة لشخصين'], ['triple', 'غرفة ثلاثية'], ['quad', 'غرفة رباعية'], ['family', 'غرف عائلية / متصلة'], ['any', 'لا يهم']], full: true }),
      field(F, { type: 'checks', name: 'access', label: 'احتياجات خاصة', msg: 'احتياجات خاصة', options: [['wheelchair', 'كرسي متحرك'], ['elderly', 'كبار سن'], ['mobility', 'صعوبة في المشي']], full: true }),
      notes(F, 'مثال: الرغبة في السفر بعد صلاة الجمعة، مرافق لكبار السن'),
      name(F)
    )
  ];
  const parts = [];
  if (!S.umrahVisaServiceConfirmed) parts.push('هذا النموذج لا يشمل خدمة التأشيرة. يُرجى التحقق من متطلبات العمرة والتأشيرة من الجهات الرسمية في المملكة العربية السعودية قبل السفر.');
  if (!S.umrahPackagesConfirmed) parts.push('ما يمكن ترتيبه من طيران وسكن وتنقلات يتم تأكيده من فريقنا حسب التواريخ.');
  const form = formCard(ctx, { id: F, service: 'umrah', serviceLabel: 'الاستفسار عن ترتيبات عمرة', prefix: 'U', title: 'استفسر عن خيارات العمرة', sub: 'المواعيد والمسافرون ومدة الإقامة', required, optional, cta: page.cta, disclosure: parts.join(' ') });
  const faqs = [
    ['هل تقدمون باقات عمرة؟', S.umrahPackagesConfirmed ? 'نعم. أرسل تفاصيل رحلتك وسيرسل لك فريقنا الخيارات المتاحة.' : 'أرسل تفاصيل رحلتك وسيوضح لك فريقنا ما يمكن ترتيبه من طيران وسكن وتنقلات حسب التواريخ المطلوبة.'],
    ['هل تساعدون في تأشيرة العمرة؟', S.umrahVisaServiceConfirmed ? 'نعم، اختر «المساعدة في التأشيرة» ضمن الخدمات المطلوبة وسيوضح لك الفريق المتطلبات.' : 'هذا النموذج لا يشمل خدمة التأشيرة حالياً. تحقّق من المتطلبات الرسمية عبر الجهات المختصة في المملكة العربية السعودية قبل السفر.'],
    ['هل يمكن طلب فندق قريب من الحرم؟', 'نعم. حدّد المسافة المفضّلة من الحرم ضمن «أضف تفضيلاتك»، وسيوضح لك الفريق الخيارات المتاحة ومسافتها التقريبية.'],
    ['معنا كبار سن أو مستخدم كرسي متحرك، هل تراعون ذلك؟', 'اذكر ذلك في «احتياجات خاصة» حتى يُؤخذ في الاعتبار عند اقتراح السكن والتنقل قدر الإمكان، واسأل الفريق عن تفاصيل كل خيار.'],
    ['متى يُفضّل إرسال الطلب؟', 'في مواسم الذروة مثل رمضان والإجازات يزداد الطلب وقد تقل الخيارات المتاحة، لذلك يُفضّل إرسال طلبك مبكراً قدر الإمكان.'],
    ['هل يتم الحجز بمجرد إرسال الطلب؟', 'لا. الطلب استفسار فقط، ولا يتم أي حجز أو دفع قبل موافقتك على التفاصيل والشروط.'],
    paymentFaq(ctx),
    hoursFaq(ctx)
  ];
  page.jsonld = [faqJsonLd(faqs)];
  const body = `
${hero(ctx, {
    eyebrow: 'رحلات العمرة — ' + esc(ctx.cfg.brand.nameAr),
    h1: 'رحلتك للعمرة <span class="accent">تبدأ بترتيبات تناسب احتياجك</span>',
    lead: 'حدّد مواعيد السفر وعدد المسافرين ومدة الإقامة في مكة المكرمة والمدينة المنورة، واذكر احتياجات السكن والتنقل، ونساعدك في الاطلاع على الخيارات المناسبة لرحلتك.',
    points: [['calendar', 'مواعيد ومدة تناسبك'], ['mosque', 'إقامة مكة والمدينة حسب طلبك'], ['accessible', 'مراعاة كبار السن والتنقل']],
    assure: ['بدون دفع عبر الموقع', 'لا نطلب بيانات الجواز الآن', 'تراجع الرسالة قبل إرسالها'],
    mediaOpts: { file: 'umrah/hero-makkah', alt: 'غرفة فندقية بإطلالة على المسجد الحرام والكعبة المشرفة', icon: 'mosque', need: 'مكة المكرمة (Hero)', pos: '63% 50%', posMobile: '60% 50%' },
    formHtml: form
  })}
${steps('كيف نرتّب طلبك؟', 'خطوات واضحة تبدأ برسالة واحدة.', [
    ['calendar', 'حدّد تفاصيل الرحلة', 'تاريخ السفر، خط السير، عدد الليالي في كل مدينة وعدد المسافرين.'],
    ['chat', 'نوضّح لك الخيارات', 'يرسل لك فريقنا ما يناسب طلبك من سكن وطيران وتنقلات المتاحة لتواريخك.'],
    ['check', 'تراجع وتقرر', 'تسأل عن المسافة والشروط، ولا يتم أي حجز إلا بعد موافقتك.']
  ])}
<section class="section section--sand" aria-labelledby="care-h">
  <div class="container split">
    <div>
      <h2 id="care-h">تفاصيل نراعيها في طلبك</h2>
      <p style="color:var(--muted)">كل ما تذكره في الطلب يساعد في اقتراح ترتيبات أنسب لك ولمن معك.</p>
      <ul class="checklist">
        <li>${I.pin}<div><b>المسافة من الحرم</b><span>قريب مشياً أو مسافة متوسطة مع مواصلات — حسب تفضيلك.</span></div></li>
        <li>${I.car}<div><b>التنقلات</b><span>من وإلى المطار وبين مكة المكرمة والمدينة المنورة إذا احتجتها.</span></div></li>
        <li>${I.accessible}<div><b>كبار السن والاحتياجات الخاصة</b><span>اذكرها حتى تُراعى في اختيار السكن والتنقل.</span></div></li>
        <li>${I.users}<div><b>ترتيب الغرف للعائلة</b><span>ثنائية أو ثلاثية أو رباعية أو غرف متصلة.</span></div></li>
      </ul>
    </div>
    ${media(ctx, { file: 'umrah/hero-makkah', alt: 'إطلالة على الكعبة المشرفة والمسجد الحرام من نافذة غرفة فندقية', icon: 'mosque', need: 'مكة المكرمة', ar: '5/4', pos: '62% 55%' })}
  </div>
</section>
${trust(ctx, 'استفسر براحة واطمئنان', TRUST_ITEMS(ctx))}
${faq('faq', 'أسئلة شائعة عن رحلات العمرة', faqs, media(ctx, { file: 'umrah/hero-makkah', alt: 'برج الساعة في مكة المكرمة عند الغروب', icon: 'mosque', need: 'مكة المكرمة', ar: '4/5', pos: '72% 30%' }))}
${finalCta('ابدأ ترتيبات رحلتك للعمرة', 'أرسل التفاصيل ويكون رقم طلبك معك في رسالة واتساب.', 'استفسر عن خيارات العمرة')}
`;
  return { page, body };
}

/* =========================================================
   HOME — category selector (ads should link to service pages directly)
   ========================================================= */
export function home(ctx) {
  const page = {
    route: '/', service: 'home', form: false,
    title: 'الفنار للسياحة | حجز فنادق وتذاكر طيران وشهر العسل والعمرة',
    description: 'الفنار للسياحة: اطلب خيارات حجز الفنادق وتذاكر الطيران ورحلات شهر العسل وترتيبات العمرة من أي مدينة، وتواصل مع فريقنا مباشرة عبر واتساب.'
  };
  const cats = [
    ['/hotels', 'الفنادق', 'حجز فنادق يناسب وجهتك وميزانيتك.', 'hotels/hero-room', 'bed', 'غرفة فندقية'],
    ['/flights', 'تذاكر الطيران', 'ذهاب وعودة أو وجهات متعددة.', 'flights/hero-airport', 'plane', 'مسافر في المطار'],
    ['/flights/honeymoon', 'شهر العسل', 'رحلة تبدأ بتفاصيل تناسبكم.', 'honeymoon/hero-resort', 'heart', 'منتجع رومانسي'],
    ['/flights/umrah', 'العمرة', 'ترتيبات تناسب احتياجك.', 'umrah/hero-makkah', 'mosque', 'مكة المكرمة']
  ];
  const body = `
<section class="section" aria-labelledby="h1">
  <div class="container">
    <div class="section-head"><p class="eyebrow" style="color:var(--gold-700)">${esc(ctx.cfg.brand.nameAr)}</p><h1 id="h1" style="font-size:clamp(28px,4vw,44px)">ما الخدمة التي تحتاجها لرحلتك؟</h1><p>اختر الخدمة واملأ التفاصيل، ونجهّز لك رسالة واتساب كاملة ترسلها لفريقنا.</p></div>
    <div class="cat-grid">${cats.map(([r, t, p, img, ic, need]) => `<a class="cat" href="${ctx.link(r)}">${media(ctx, { file: img, alt: '', icon: ic, need, ar: null, sizes: '(max-width: 1000px) 50vw, 25vw', pos: { 'hotels/hero-room': '80% 55%', 'flights/hero-airport': '72% 50%', 'honeymoon/hero-resort': '52% 55%', 'umrah/hero-makkah': '63% 50%' }[img] })}<div class="cat__body"><h2>${t}</h2><p>${p}</p><span class="cat__go">ابدأ الطلب ${I.arrowStart}</span></div></a>`).join('')}</div>
  </div>
</section>
${steps('كيف تعمل الخدمة؟', '', [
    ['list', 'اختر الخدمة واملأ التفاصيل', 'نموذج قصير مخصص لكل خدمة.'],
    ['whatsapp', 'أرسل الرسالة الجاهزة', 'يُفتح واتساب برسالة فيها رقم طلبك وكل التفاصيل.'],
    ['check', 'تصلك الخيارات', 'يتواصل معك فريقنا في نفس المحادثة.']
  ])}
`;
  return { page, body };
}

/* =========================================================
   LEGAL placeholders — must be completed and reviewed by counsel
   ========================================================= */
export function privacy(ctx) {
  const b = ctx.cfg.brand;
  const page = { route: '/privacy', service: 'legal', form: false, noindex: !ctx.cfg.integrations.privacyPolicyApproved, title: 'سياسة الخصوصية – ' + b.nameAr, description: 'سياسة الخصوصية لموقع ' + b.nameAr + '.' };
  const body = `
<section class="section"><div class="container"><article class="legal">
  <h1>سياسة الخصوصية</h1>
  ${ctx.cfg.integrations.privacyPolicyApproved ? '' : `<p class="ph-block">مسودة هيكلية فقط — يجب أن يراجعها مستشار قانوني ويعتمدها ${esc(b.nameAr)} قبل الإطلاق، بما يتوافق مع لائحة حماية خصوصية البيانات المعمول بها في دولة الكويت وأي متطلبات أخرى منطبقة.</p>`}
  <h2>من نحن</h2><p>${ctx.ph(b.legalNameAr, 'الاسم القانوني للشركة')}، الكويت. للتواصل: واتساب أو هاتف <span dir="ltr">${esc(ctx.cfg.contact.phoneDisplay || '')}</span>.</p>
  <h2>البيانات التي نجمعها</h2>
  <p>عند تعبئة نموذج الطلب: تفاصيل الرحلة التي تدخلها (مثل الوجهة والتواريخ وعدد المسافرين والميزانية والتفضيلات والاسم إن أدخلته). لا نطلب في النموذج رقم جواز سفر أو هوية أو بيانات دفع.</p>
  <p>بيانات الحملة الإعلانية (مثل مصدر الزيارة ومعرّفات UTM)، ومعرّفات النقر الإعلانية (مثل GCLID) فقط إذا وافقت على ملفات تعريف الارتباط الإعلانية.</p>
  <h2>كيف نستخدمها</h2><p>للرد على طلبك وإرسال الخيارات، ولقياس فعالية إعلاناتنا بشكل إجمالي. ${ctx.ph('', 'أي استخدامات إضافية يحددها الفنار')}</p>
  <h2>واتساب</h2><p>عند الضغط على زر واتساب تُنقل إلى تطبيق واتساب برسالة جاهزة. إرسال الرسالة قرارك، وتخضع المحادثة لشروط وسياسة خصوصية واتساب.</p>
  <h2>مدة الاحتفاظ</h2><p>${ctx.ph('', 'مدة الاحتفاظ بالطلبات والبيانات')}</p>
  <h2>مشاركة البيانات</h2><p>${ctx.ph('', 'الجهات التي تتم مشاركة البيانات معها (مثل مزودي الفنادق وشركات الطيران عند التأكيد، ومزودي التحليلات)')}</p>
  <h2>حقوقك</h2><p>${ctx.ph('', 'آلية طلب الاطلاع على البيانات أو تصحيحها أو حذفها')}</p>
  <h2>ملفات تعريف الارتباط</h2><p>يمكنك تغيير اختيارك في أي وقت من رابط «إعدادات ملفات تعريف الارتباط» أسفل الصفحة.</p>
</article></div></section>`;
  return { page, body };
}
export function terms(ctx) {
  const b = ctx.cfg.brand;
  const page = { route: '/terms', service: 'legal', form: false, noindex: true, title: 'الشروط والأحكام – ' + b.nameAr, description: 'الشروط والأحكام لموقع ' + b.nameAr + '.' };
  const body = `
<section class="section"><div class="container"><article class="legal">
  <h1>الشروط والأحكام</h1>
  <p class="ph-block">مسودة هيكلية فقط — تُستكمل وتُعتمد من ${esc(b.nameAr)} ومستشار قانوني قبل الإطلاق.</p>
  <h2>طبيعة الخدمة</h2><p>نماذج هذا الموقع لطلب خيارات واستفسارات فقط، ولا تمثل حجزاً أو عرض سعر ملزماً. يتم أي حجز فقط بعد موافقتك على التفاصيل والسعر والشروط مع فريقنا.</p>
  <h2>الأسعار والتوفر</h2><p>الأسعار والتوفر تحددهما الفنادق وشركات الطيران ومزودو الخدمة وقد تتغير حتى لحظة التأكيد.</p>
  <h2>الإلغاء والتعديل</h2><p>${ctx.ph('', 'سياسة الإلغاء والتعديل المعتمدة لدى الفنار، بالإضافة إلى شروط كل مزود')}</p>
  <h2>الدفع</h2><p>${ctx.ph('', 'طرق الدفع وشروطه')}</p>
  <h2>المسؤولية</h2><p>${ctx.ph('', 'حدود المسؤولية — يصيغها المستشار القانوني')}</p>
  <h2>بيانات الشركة</h2><p>السجل التجاري: ${ctx.ph(ctx.cfg.licensing.commercialRegistration, 'رقم السجل التجاري')} · الترخيص السياحي: ${ctx.ph(ctx.cfg.licensing.tourismLicense, 'رقم الترخيص')}</p>
</article></div></section>`;
  return { page, body };
}
export function notFound(ctx) {
  const page = { route: '/404', service: 'legal', form: false, noindex: true, title: 'الصفحة غير موجودة – ' + ctx.cfg.brand.nameAr, description: '' };
  const body = `<section class="section"><div class="container" style="text-align:center"><h1>الصفحة غير موجودة</h1><p>اختر الخدمة التي تحتاجها:</p><p style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><a class="btn" href="${ctx.link('/hotels')}">الفنادق</a><a class="btn btn--ghost" href="${ctx.link('/flights')}">تذاكر الطيران</a><a class="btn btn--ghost" href="${ctx.link('/flights/honeymoon')}">شهر العسل</a><a class="btn btn--ghost" href="${ctx.link('/flights/umrah')}">العمرة</a></p></div></section>`;
  return { page, body };
}
