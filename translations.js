// Bilingual EN/HI translator
// Keys are stable string IDs placed on elements via data-i18n="<key>".
// On first apply, the original EN innerHTML is cached on dataset.enHtml so
// switching back is lossless.
(function () {
  const I18N = {
    // Topbar
    'topbar.mark': 'प्रिंस <em>तोमर</em>',
    'nav.about':    'परिचय',
    'nav.borderlands':  'सरहदें',
    'nav.gallery':  'चित्रशाला',
    'nav.latest': 'लेखन',
    'nav.ai':       'प्रयोग',
    'nav.play':  'खेल',
    'nav.epilogue': 'उपसंहार',
    'nav.cv':       'सीवी',

    // Hero
    'hero.title': 'प्रिंस <span class="it">तोमर</span><br />— सरहदों का<br />एक संग्रह।',
    'hero.sub':   'डॉक्टरल शोधार्थी',

    // Bio
    'bio.p1':   '<span class="drop-cap">प्रिं</span>स तोमर तालिन विश्वविद्यालय के Centre for Landscape and Culture में डॉक्टरल शोधार्थी हैं। वे भारतीय हिमालय की सरहदी जनसंख्या के बीच कार्य करते हैं, विशेष रूप से सड़क-निर्माण की गतिकी पर — अवसंरचना, क्षेत्रीकरण, और इतिहास, भू-राजनीति व भूगोल के सूक्ष्म नृत्य के बीच के सम्बन्धों का अनुसरण करते हुए।',
    'bio.p3':   'अकादमिक कार्य से परे, वे कविताएँ लिखते हैं और मानवशास्त्र व साहित्य के बीच की पारगम्य सीमा में रुचि रखते हैं। उनकी वर्तमान परियोजना सड़क-निर्माण की त्वरित होती गति के साथ भारतीय हिमालय में परिवर्तन के स्थानिक-कालिक आयामों का अध्ययन करती है।',
    'bio.p4':   '<span class="drop-cap">मैं</span> यहाँ एक खुली पोथी रखता हूँ: क्षेत्र से छायाचित्र, संदेश और AI के साथ छोटे प्रयोग, और एक उपसंहार — जो पढ़ा, सोचा और सुना जा रहा है, उसका लेखा।',

    // Regions — Ladakh
    // Regions
    'regions.h':             'क्षेत्र <span class="it">स्थल।</span>',
    'regions.ladakh.label':  'क्षेत्र-स्थल १ · लद्दाख',
    'regions.ladakh.h':      'लद्दाख, <span class="it">शीत सरहद।</span>',
    'regions.ladakh.meta1':  '२०२४ — चालू',
    'regions.ladakh.meta2':  'शीत मरुस्थल · ३५००मी',
    'regions.ladakh.atlas':  'क्षेत्र-मानचित्र खोलें',
    'regions.ladakh.p':      'चीन और पाकिस्तान के साथ भारत की सीमाओं पर रणनीतिक सड़क-निर्माण का अध्ययन। अलकतरे के आगमन के पीछे क्या है, पर्वतों का स्थान, और एक ऐसी भूमि में पर्यटन का आगमन जिसे उसकी दूरी ने सदा परिभाषित किया?',

    // Regions — Terai
    'regions.terai.label':   'क्षेत्र-स्थल २ · तराई',
    'regions.terai.h':       'तराई, <span class="it">एक छिद्रित सीमा।</span>',
    'regions.terai.meta1':   '२०२३ — चालू',
    'regions.terai.meta2':   'तराई · ८०मी',
    'regions.terai.p':       'जुड़वाँ नगर रक्सौल व बीरगंज — दो गणराज्यों के बीच एक अल्पविराम। एक सीमाहीन सरहद, जो सदियों की संस्कृति, सम्बन्धों, आस्था, और अब अर्थव्यवस्था के जाल की बुनावट से कसकर बँधी है।',

    'regions.read': 'आगे पढ़ें <span class="arrow">→</span>',

    // Gallery
    'gallery.h':     'क्षेत्र, <span class="it">धीरे-धीरे चित्रित।</span>',
    'gallery.aside': 'क्षेत्र से छायाचित्रों के समूह, प्रत्येक एक मौन विषय के चारों ओर। पूर्ण संग्रह गैलरी उप-डोमेन पर है।',
    'gallery.cta':   '→ सम्पूर्ण चित्रशाला देखें <span class="ext">gallery.princetomar.com</span>',
    'gallery.count': '२४० में से ०४ फलक',

    // AI
    'ai.h':     'पोथी से <span class="it">परे।</span>',
    'ai.blurb': 'एक छोटी, खुली प्रयोगशाला: संकेत, प्रतिमान, और मानवशास्त्र व यंत्र-पठन के संधि पर मौन उद्बोधन। निष्कर्ष नहीं — अनावरण।',

    'ai.card0.h': 'पीअर रिव्यू <span class="it">ट्रैकर</span> · 2026',
    'ai.card0.p': 'अकादमिक समीक्षकों की प्रतिक्रिया को संशोधन के एक संरचित, खेल-रूपी रोडमैप में मोड़ें। यह समीक्षकों की टिप्पणियों का विश्लेषण करता है, उन्हें विषय व महत्ता के अनुसार व्यवस्थित करता है, और XP पुरस्कारों के साथ प्राथमिकता-क्रम में दैनिक कार्य बनाता है। प्रगति-पट्टियाँ बड़े व छोटे संशोधनों में आपकी राह दर्शाती हैं — कोई खाता नहीं, कोई डेटा-संग्रह नहीं, सब कुछ स्थानीय रूप से सुरक्षित।',
    'ai.card1.h': 'बार्ड की <span class="it">बाम</span> · 2025',
    'ai.card1.p': 'अकादमिक जीवन की थकान? समीक्षकों से प्रतिशोध का मन? शेक्सपियर मदद कर सकते हैं — अपना मन डालें, बार्ड एक छंद देता है; उत्साहवर्धक, या शायद केवल कड़वा सच। Google खाता आवश्यक।',
    'ai.card2.h': 'एक भाषा-प्रतिमान <span class="it">ट्रांस-हिमालय</span> में चलता है',
    'ai.card2.p': '१९६२ की खंडित सड़क-सर्वेक्षण डायरियों को एक छोटे प्रतिमान को खिलाकर, उसे लुप्त किलोमीटरों का स्वप्न देखने को कहना।',
    'ai.card3.h': 'तीन ऊँचाइयों में एक <span class="it">कविता</span>',
    'ai.card3.p': 'मेरी एक छंद से सहलेखन — प्रतिमान के साथ, फिर वापस मोड़कर, फिर पुनः — यह देखने को कि किस ऊँचाई पर रचयिता विलीन हो जाता है।',

    // Writing
    'writings.h':   'शब्द, जो सड़क से <span class="it">धीमे चलते हैं।</span>',
    'writings.cv':  '<span class="cv-ico" aria-hidden="true"></span><span class="cv-txt">सीवी डाउनलोड करें</span><span class="cv-meta">PDF</span>',
    'writings.kind.peer': 'सहकर्मी-समीक्षित',
    'writings.kind.blog': 'ब्लॉग',
    'writings.kind.review': 'फ़िल्म समीक्षा',
    'writings.kind.essay': 'निबंध',
    'writings.pyre.t': '<a href="https://doi.org/10.2218/himalaya.2025.10878" target="_blank" rel="noopener">समीक्षा: <span class="it">चिता</span> (Pyre) — निर्देशक विनोद कपरि</a>',
    'writings.w1.t': '“धूल की ओर”: <span class="it">भारत–नेपाल सीमा पर सीमा-पारगमन और अवसंरचना की स्थिति</span>',
    'writings.w1.v': 'Asian Geographer · प्रकाशनार्थ',
    'writings.w2.t': 'निर्माता, निर्माण, और निर्मित: <span class="it">लद्दाख और सड़क-विकास की घटना-शीलता</span>',
    'writings.w2.v': 'HIMALAYA · प्रकाशनार्थ',
    'writings.w3.t': 'दूरी की वार्ता: <span class="it">लद्दाख, भारत में विषमस्थानिक सड़कें और साहसिक पर्यटन</span>',
    'writings.w3.v': 'Journal of Tourism and Cultural Change · समीक्षाधीन',
    'writings.w4.t': '<a href="https://ethnomarginalia.com/the-field-the-border-and-i/" target="_blank" rel="noopener">क्षेत्र, सीमा, और मैं <span class="w-ext" aria-hidden="true">↗</span></a>',
    'writings.w4.v': 'ethnomarginalia.com · निबंध',
    'writings.note': 'वार्ताओं व कार्य-पत्रों की पूरी सूची सीवी पर है।',

    // Writing
    'writing.h': 'और सड़क, <span class="it">एक लम्बे वाक्य की भाँति,</span> आती है।',
    'writing.poem.title': 'मेढ़, बुलडोज़र के साथ',
    'writing.poem.s1':    'पहले धूल ने एक नई दिशा सीखी।\nफिर बकरियों ने। फिर बकरियों के नाम।\nजाड़े तक पर्वत ने स्वीकार कर लिया\nकि उसे किलोमीटरों में मापा जाए।',
    'writing.poem.s2':    'सड़क, मेरे विचार में, एक प्रकार का व्याकरण है —\nवह क्रिया रखती है वहाँ जहाँ पहले केवल\nदीवार की लम्बी, मन्द संज्ञा थी।',
    'writing.poem.attr':  '— अंश · क्षेत्र-पोथी, नुब्रा, २०२४',

    // Epilogue
    'epilogue.h':    'इन दिनों <span class="it">पठन, श्रवण, चिंतन।</span>',
    'epilogue.lede': 'एक खुली, अद्यतन सूची — मेज़ पर रखी पुस्तकें, क्षेत्र से ध्वनियाँ, और मन में घूमते विचार।',

    'epi.col1.h': '<span>मेज़ पर</span><span class="num">/ पुस्तकें</span>',
    'epi.col2.h': '<span>कानों में</span><span class="num">/ ध्वनि</span>',
    'epi.col3.h': '<span>मन में</span><span class="num">/ विचार</span>',

    'epi.col1.i1.a': 'यी-फू तुआन · १९७७',
    'epi.col1.i2.a': 'एदुआर्दो गालेआनो पर · पुनः-पठन',
    'epi.col1.i3.a': 'नैन शेपर्ड · १९७७',
    'epi.col1.more': 'गुडरीड्स पर पूरी सूची देखें <span class="arrow">↗</span>',
    'epi.col2.more': 'SoundCloud पर सम्पूर्ण सूची देखें <span class="arrow">↗</span>',

    'epi.col2.i1.t': 'क्षेत्र-ध्वनियाँ, नुब्रा घाटी',
    'epi.col2.i1.a': 'स्व-संग्रह · २०२४',
    'epi.col2.i2.a': 'धीरे, बार-बार',
    'epi.col2.i3.t': 'भोजपुरी सीमा-रेडियो',
    'epi.col2.i3.a': 'रक्सौल, AM डायल',

    'epi.col3.i1.t': 'सड़क संज्ञा है या क्रिया।',
    'epi.col3.i2.t': 'धूल का व्याकरण।',
    'epi.col3.i3.t': 'कैसे एक हिमनद अपने अनुसूचित समय रखता है।',

    // Road Game
    'rg.title': 'एक <span class="it">प्रति-खेल।</span>',
    'rg.p1':    'यदि खेल उपलब्धियों और अंकों के तेज़ संग्रह के बारे में हैं, तो यह एक प्रति-खेल है। तीन संवादी मिनटों में यह लद्दाख में मेरे काम से मिली एक सीख बाँटता है: <em>कोई पहाड़ों पर नहीं होता, बल्कि उनमें होता है।</em> यात्रा के हमारे सपने हमें ऐसी जगहों पर एक जानी-पहचानी भिन्नता की तलाश में ले जाते हैं, जो हमारे भीतर कहीं छिपी रहती है, जबकि हम उसे और कहीं खोजते रहते हैं। तब तक — जब तक हम स्थान और मन को एक-दूसरे को बदलने देते हैं, और यह नहीं जान लेते कि जो हम खोज रहे हैं, वह प्रतीक्षा के उन्हीं क्षणों में है।',
    'rg.coda':  'इस खेल का आनंद लें — क्षणों को संजोने का — कुछ करने से नहीं, बल्कि ठहरकर, और पहाड़ों को अपना काम करने देकर।',
    'rg.foot.1': 'स्पेस · टैप · शिखरों से छलाँग',
    'rg.foot.2': '३ पर्वत-श्रृंखलाएँ · ~३ मिनट की यात्रा',
    'rg.foot.3': 'पर्वत · सुरंगें · याक · बकरियाँ · सड़क-निर्माण · भूस्खलन',

    // Footer
    'footer.mark': 'प्रिंस <span class="it">तोमर</span>.',
    'footer.sub':  '— सरहदों का एक संग्रह, धीरे-धीरे लिखा गया।',
    'foot.h.sections':    'खंड',
    'foot.h.affiliation': 'संस्थान',
    'foot.h.elsewhere':   'और कहीं',
    'foot.cv':            'सीवी (PDF) ↓',
    'foot.nav.gallery':   'चित्रशाला',
    'foot.nav.ai':        'प्रयोग',
    'foot.nav.play':      'खेल',
    'foot.affil.1': 'तालिन विश्वविद्यालय',
    'foot.affil.2': 'Centre for Landscape & Culture',
    'foot.affil.3': 'तालिन, एस्तोनिया',

    // Field map — Ladakh
    'map.title':       'क्षेत्र, <span class="it">शोध के परे।</span>',
    'map.legend.site': 'गाँव / स्थल',
    'map.legend.pass': 'पर्वत-दर्रा',
  };

  function applyLang(lang) {
    document.documentElement.setAttribute('lang', lang);
    document.body.setAttribute('data-lang', lang);
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (el.dataset.enHtml == null) el.dataset.enHtml = el.innerHTML;
      if (lang === 'hi' && I18N[key] != null) {
        el.innerHTML = I18N[key];
      } else {
        el.innerHTML = el.dataset.enHtml;
      }
    });
  }
  // Expose so React-rendered components (e.g. the field map) can
  // re-translate themselves after they mount.
  window.applyLang = applyLang;

  function setLang(lang) {
    if (lang !== 'en' && lang !== 'hi') lang = 'en';
    const toggle = document.querySelector('.lang-toggle');
    if (toggle) toggle.setAttribute('data-lang', lang);
    try { localStorage.setItem('pt-lang', lang); } catch (e) {}
    applyLang(lang);
  }

  function init() {
    const toggle = document.querySelector('.lang-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const cur = toggle.getAttribute('data-lang') || 'en';
        setLang(cur === 'en' ? 'hi' : 'en');
      });
    }
    let saved = null;
    try { saved = localStorage.getItem('pt-lang'); } catch (e) {}
    setLang(saved || 'en');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
