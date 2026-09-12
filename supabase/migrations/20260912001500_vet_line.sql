-- ============================================================================
-- Vet line ("دارو"): brands, category tree and the owner's 53 products.
-- Source: the owner's three spreadsheets + the brand-sheet photo (2026-09-12).
--
-- Products land as DRAFT with a single 0-priced variant and no stock: the source
-- files carry no prices, SKUs or images. Pricing them in the admin is what makes
-- them sellable. Idempotent: re-running changes nothing.
--
-- Source-data corrections, all deliberate (see HANDOFF "Vet line"):
--   * "براوکتو 1400" sat in the CAT medicines sheet but is a dog product (40–56 kg) -> dog.
--   * In "مشترک سگ و گربه.xlsx" the two hygiene sheets' contents are swapped: the toothpaste
--     was under "پوست و مو" and the shampoos under "دهان و دندان" -> swapped back.
--   * The owner's list names a shared "مکمل مفاصل"; the joint products actually live in the
--     dog/cat sheets, so they are filed in BOTH their species shelf and مکمل مفاصل.
--   * The 5 organ/energy supplements in the shared sheet are not joint products, so they get
--     their own shelf, "مکمل عمومی سگ و گربه" (med-general-supplements).
--   * "غذای درمانی" (dog and cat) ships EMPTY: the owner sent no rows for it yet.
-- ============================================================================
set client_min_messages to warning;

do $$
declare
  v_store uuid;
  v_rec   record;
  v_cid   uuid;
  v_pid   uuid;
begin
  select id into v_store from public.stores where slug = 'default';
  if v_store is null then
    raise notice 'no store with slug "default" -- vet line skipped';
    return;
  end if;

  -- ---------- brands (the seven on the owner's brand sheet) ----------
  for v_rec in select * from (values
    ('zoetis', 'Zoetis', 0),
    ('boehringer-ingelheim', 'Boehringer Ingelheim', 1),
    ('virbac', 'Virbac', 2),
    ('msd', 'MSD', 3),
    ('vet-expert', 'Vet Expert', 4),
    ('royal-canin-veterinary', 'Royal Canin Veterinary', 5),
    ('purina-pro-plan', 'Purina Pro Plan', 6)
  ) as b(slug, name, ord) loop
    insert into public.brands (store_id, slug, name, sort_order)
    values (v_store, v_rec.slug, v_rec.name, v_rec.ord)
    on conflict (store_id, slug) do nothing;
  end loop;

  -- ---------- categories ----------
  -- "دارو" carries sort_order -1 so it leads the navbar, which shows categories #1-#3.
  for v_rec in select * from (values
    ('medicine', null, 'دارو', 'Medicine', 'İlaç', -1),
    ('med-dog-antiparasitic', 'medicine', 'دارو و ضد انگل سگ', 'Dog — Medicine & Antiparasitics', 'Köpek — İlaç ve Antiparaziter', 0),
    ('med-dog-supplements', 'medicine', 'مکمل و مراقبت سگ', 'Dog — Supplements & Care', 'Köpek — Takviye ve Bakım', 1),
    ('med-dog-therapeutic-food', 'medicine', 'غذای درمانی سگ', 'Dog — Therapeutic Food', 'Köpek — Terapötik Mama', 2),
    ('med-cat-antiparasitic', 'medicine', 'دارو و ضد انگل گربه', 'Cat — Medicine & Antiparasitics', 'Kedi — İlaç ve Antiparaziter', 3),
    ('med-cat-supplements', 'medicine', 'مکمل و مراقبت گربه', 'Cat — Supplements & Care', 'Kedi — Takviye ve Bakım', 4),
    ('med-cat-therapeutic-food', 'medicine', 'غذای درمانی گربه', 'Cat — Therapeutic Food', 'Kedi — Terapötik Mama', 5),
    ('med-skin-coat', 'medicine', 'بهداشت پوست و مو سگ و گربه', 'Skin & Coat Care — Dogs & Cats', 'Deri ve Tüy Bakımı — Köpek ve Kedi', 6),
    ('med-dental', 'medicine', 'بهداشت دهان و دندان سگ و گربه', 'Dental Care — Dogs & Cats', 'Diş Bakımı — Köpek ve Kedi', 7),
    ('med-joint', 'medicine', 'مکمل مفاصل سگ و گربه', 'Joint Supplements — Dogs & Cats', 'Eklem Takviyeleri — Köpek ve Kedi', 8),
    ('med-general-supplements', 'medicine', 'مکمل عمومی سگ و گربه', 'General Supplements — Dogs & Cats', 'Genel Takviyeler — Köpek ve Kedi', 9)
  ) as c(slug, parent, fa, en, tr, ord) loop
    insert into public.categories (store_id, parent_id, slug, sort_order)
    values (v_store,
            case when v_rec.parent is null then null
                 else (select id from public.categories where store_id = v_store and slug = v_rec.parent) end,
            v_rec.slug, v_rec.ord)
    on conflict (store_id, slug) do nothing;

    select id into v_cid from public.categories where store_id = v_store and slug = v_rec.slug;
    insert into public.category_translations (category_id, locale, name) values
      (v_cid, 'fa', v_rec.fa), (v_cid, 'en', v_rec.en), (v_cid, 'tr', v_rec.tr)
    on conflict (category_id, locale) do nothing;
  end loop;

  -- ---------- products ----------
  for v_rec in select * from (values
    ('simparica-120mg-3', 'قرص سیمپاریکا 120 میلی‌گرم، بسته 3 عددی — سگ 40 تا 60 کیلو', 'Simparica 120 mg — 3 tablets, dogs 40–60 kg', 'Simparica 120 mg — 3 tablet, 40–60 kg köpekler için', 'zoetis', 'med-dog-antiparasitic'),
    ('simparica-5mg-3', 'قرص سیمپاریکا 5 میلی‌گرم، بسته 3 عددی — سگ 1.3 تا 2.5 کیلو', 'Simparica 5 mg — 3 tablets, dogs 1.3–2.5 kg', 'Simparica 5 mg — 3 tablet, 1.3–2.5 kg köpekler için', 'zoetis', 'med-dog-antiparasitic'),
    ('evicto-dog-20-40', 'قطره ایویکتو، بسته 4 پیپت - سگ 20 تا 40 کیلو', 'Evicto spot-on — 4 pipettes, dogs 20–40 kg', 'Evicto damla — 4 pipet, 20–40 kg köpekler için', 'virbac', 'med-dog-antiparasitic'),
    ('evicto-dog-10-20', 'قطره ایویکتو، بسته 4 پیپت — سگ 10 تا 20 کیلو', 'Evicto spot-on — 4 pipettes, dogs 10–20 kg', 'Evicto damla — 4 pipet, 10–20 kg köpekler için', 'virbac', 'med-dog-antiparasitic'),
    ('evicto-dog-5-10', 'قطره ایویکتو، بسته 4 پیپت — سگ 5 تا 10 کیلو', 'Evicto spot-on — 4 pipettes, dogs 5–10 kg', 'Evicto damla — 4 pipet, 5–10 kg köpekler için', 'virbac', 'med-dog-antiparasitic'),
    ('evicto-dog-2-6-5', 'قطره ایویکتو، بسته 4 پیپت — سگ 2.6 تا 5 کیلو', 'Evicto spot-on — 4 pipettes, dogs 2.6–5 kg', 'Evicto damla — 4 pipet, 2.6–5 kg köpekler için', 'virbac', 'med-dog-antiparasitic'),
    ('effipro-duo-dog-20-40', 'قطره افی‌پرو دوئو — سگ 20 تا 40 کیلو، بسته 4 پیپت', 'Effipro Duo spot-on — 4 pipettes, dogs 20–40 kg', 'Effipro Duo damla — 4 pipet, 20–40 kg köpekler için', 'virbac', 'med-dog-antiparasitic'),
    ('effipro-duo-dog-10-20', 'قطره افی‌پرو دوئو — سگ 10 تا 20 کیلو، بسته 4 پیپت', 'Effipro Duo spot-on — 4 pipettes, dogs 10–20 kg', 'Effipro Duo damla — 4 pipet, 10–20 kg köpekler için', 'virbac', 'med-dog-antiparasitic'),
    ('effipro-duo-dog-2-10', 'قطره افی‌پرو دوئو — سگ 2 تا 10 کیلو، بسته 4 پیپت', 'Effipro Duo spot-on — 4 pipettes, dogs 2–10 kg', 'Effipro Duo damla — 4 pipet, 2–10 kg köpekler için', 'virbac', 'med-dog-antiparasitic'),
    ('effitix-dog-4-10', 'قطره ضدانگل افیتیکس — سگ 4 تا 10 کیلو، 4 پیپت', 'Effitix spot-on — 4 pipettes, dogs 4–10 kg', 'Effitix damla — 4 pipet, 4–10 kg köpekler için', 'virbac', 'med-dog-antiparasitic'),
    ('effitix-dog-1-5-4', 'قطره ضدانگل افیتیکس — سگ 1.5 تا 4 کیلو، 4 پیپت', 'Effitix spot-on — 4 pipettes, dogs 1.5–4 kg', 'Effitix damla — 4 pipet, 1.5–4 kg köpekler için', 'virbac', 'med-dog-antiparasitic'),
    ('effitix-dog-20-40', 'قطره ضدانگل افیتیکس — سگ 20 تا 40 کیلو، 4 پیپت', 'Effitix spot-on — 4 pipettes, dogs 20–40 kg', 'Effitix damla — 4 pipet, 20–40 kg köpekler için', 'virbac', 'med-dog-antiparasitic'),
    ('effitix-dog-10-20', 'قطره ضدانگل افیتیکس — سگ 10 تا 20 کیلو، 4 پیپت', 'Effitix spot-on — 4 pipettes, dogs 10–20 kg', 'Effitix damla — 4 pipet, 10–20 kg köpekler için', 'virbac', 'med-dog-antiparasitic'),
    ('nexgard-spectra-xl', 'قرص نکس‌گارد اسپکترا XL — بسته 3 عددی، سگ 30 تا 60 کیلو', 'NexGard Spectra XL — 3 chewables, dogs 30–60 kg', 'NexGard Spectra XL — 3 çiğneme tableti, 30–60 kg köpekler için', 'boehringer-ingelheim', 'med-dog-antiparasitic'),
    ('nexgard-spectra-l', 'قرص نکس‌گارد اسپکترا L — بسته 3 عددی، سگ 15 تا 30 کیلو', 'NexGard Spectra L — 3 chewables, dogs 15–30 kg', 'NexGard Spectra L — 3 çiğneme tableti, 15–30 kg köpekler için', 'boehringer-ingelheim', 'med-dog-antiparasitic'),
    ('nexgard-spectra-m', 'قرص نکس‌گارد اسپکترا M — بسته 3 عددی، سگ 7.5 تا 15 کیلو', 'NexGard Spectra M — 3 chewables, dogs 7.5–15 kg', 'NexGard Spectra M — 3 çiğneme tableti, 7.5–15 kg köpekler için', 'boehringer-ingelheim', 'med-dog-antiparasitic'),
    ('nexgard-spectra-s', 'قرص نکس‌گارد اسپکترا S بسته 3 عددی برای سگ 3.5 تا 7.5 کیلوگرم', 'NexGard Spectra S — 3 chewables, dogs 3.5–7.5 kg', 'NexGard Spectra S — 3 çiğneme tableti, 3.5–7.5 kg köpekler için', 'boehringer-ingelheim', 'med-dog-antiparasitic'),
    ('nexgard-spectra-xs', 'قرص نکس‌گارد اسپکترا XS بسته 3 عددی برای سگ 2 تا 3.5 کیلوگرم', 'NexGard Spectra XS — 3 chewables, dogs 2–3.5 kg', 'NexGard Spectra XS — 3 çiğneme tableti, 2–3.5 kg köpekler için', 'boehringer-ingelheim', 'med-dog-antiparasitic'),
    ('nexgard-xl', 'قرص نکس‌گارد XL بسته 3 عددی برای سگ 25 تا 50 کیلوگرم', 'NexGard XL — 3 chewables, dogs 25–50 kg', 'NexGard XL — 3 çiğneme tableti, 25–50 kg köpekler için', 'boehringer-ingelheim', 'med-dog-antiparasitic'),
    ('nexgard-l', 'قرص نکس‌گارد L بسته 3 عددی برای سگ 10 تا 25 کیلوگرم', 'NexGard L — 3 chewables, dogs 10–25 kg', 'NexGard L — 3 çiğneme tableti, 10–25 kg köpekler için', 'boehringer-ingelheim', 'med-dog-antiparasitic'),
    ('nexgard-s', 'قرص نکس‌گارد S بسته 3 عددی برای سگ 2 تا 4 کیلوگرم', 'NexGard S — 3 chewables, dogs 2–4 kg', 'NexGard S — 3 çiğneme tableti, 2–4 kg köpekler için', 'boehringer-ingelheim', 'med-dog-antiparasitic'),
    ('bravecto-1000mg', 'قرص جویدنی براوکتو 1000 میلی‌گرم برای سگ بیش از 20 تا 40 کیلوگرم', 'Bravecto 1000 mg chewable — dogs 20–40 kg', 'Bravecto 1000 mg çiğneme tableti — 20–40 kg köpekler için', 'msd', 'med-dog-antiparasitic'),
    ('bravecto-500mg', 'قرص جویدنی براوکتو 500 میلی‌گرم برای سگ بیش از 10 تا 20 کیلوگرم', 'Bravecto 500 mg chewable — dogs 10–20 kg', 'Bravecto 500 mg çiğneme tableti — 10–20 kg köpekler için', 'msd', 'med-dog-antiparasitic'),
    ('bravecto-250mg', 'قرص جویدنی براوکتو 250 میلی‌گرم برای سگ بیش از 4.5 تا 10 کیلوگرم', 'Bravecto 250 mg chewable — dogs 4.5–10 kg', 'Bravecto 250 mg çiğneme tableti — 4.5–10 kg köpekler için', 'msd', 'med-dog-antiparasitic'),
    ('bravecto-112-5mg', 'قرص جویدنی براوکتو 112.5 میلی‌گرم برای سگ 2 تا 4.5 کیلوگرم', 'Bravecto 112.5 mg chewable — dogs 2–4.5 kg', 'Bravecto 112.5 mg çiğneme tableti — 2–4.5 kg köpekler için', 'msd', 'med-dog-antiparasitic'),
    ('bravecto-1400mg', 'قرص جویدنی براوکتو 1400 میلی‌گرم برای سگ بیش از 40 تا 56 کیلوگرم', 'Bravecto 1400 mg chewable — dogs 40–56 kg', 'Bravecto 1400 mg çiğneme tableti — 40–56 kg köpekler için', 'msd', 'med-dog-antiparasitic'),
    ('vetmedin-1-25mg-50', 'قرص وت‌مدین 1.25 میلی‌گرم بوهرینگر 50 عددی برای سگ', 'Vetmedin 1.25 mg — 50 tablets, dogs', 'Vetmedin 1.25 mg — 50 tablet, köpekler için', 'boehringer-ingelheim', 'med-dog-antiparasitic'),
    ('vetmedin-5mg-50', 'قرص وت‌مدین 5 میلی‌گرم بوهرینگر 50 عددی برای سگ', 'Vetmedin 5 mg — 50 tablets, dogs', 'Vetmedin 5 mg — 50 tablet, köpekler için', 'boehringer-ingelheim', 'med-dog-antiparasitic'),
    ('vetmedin-10mg-50', 'قرص وت‌مدین 10 میلی‌گرم بوهرینگر 50 عددی برای سگ', 'Vetmedin 10 mg — 50 tablets, dogs', 'Vetmedin 10 mg — 50 tablet, köpekler için', 'boehringer-ingelheim', 'med-dog-antiparasitic'),
    ('apoquel-16mg-20', 'قرص آپوکوئل 16 میلی‌گرم زوتیس 20 عددی برای سگ', 'Apoquel 16 mg — 20 tablets, dogs', 'Apoquel 16 mg — 20 tablet, köpekler için', 'zoetis', 'med-dog-antiparasitic'),
    ('baytril-k-5-50ml', 'بایتریل K پنج درصد محلول تزریقی 50 میلی‌لیتر', 'Baytril K 5% injectable solution — 50 ml', 'Baytril K %5 enjeksiyonluk çözelti — 50 ml', null, 'med-dog-antiparasitic'),
    ('alizin-10ml', 'آلیزین 10 میلی‌لیتر محلول تزریقی برای سگ', 'Alizin injectable solution — 10 ml, dogs', 'Alizin enjeksiyonluk çözelti — 10 ml, köpekler için', 'virbac', 'med-dog-antiparasitic'),
    ('isotic-ear-drops-10ml', 'قطره گوش ایزوتیک 10 میلی‌لیتر برای سگ', 'Isotic ear drops — 10 ml, dogs', 'Isotic kulak damlası — 10 ml, köpekler için', null, 'med-dog-antiparasitic'),
    ('majo-puppy-multivitamin-100g', 'خمیر یا مالت مولتی‌ویتامین توله‌سگ ماجو 100 گرم', 'Majo Puppy Multivitamin Paste — 100 g', 'Majo Yavru Köpek Multivitamin Macunu — 100 g', null, 'med-dog-supplements'),
    ('fortiflora-dog-30', 'پروبیوتیک فورتی‌فلورا سگ 30 ساشه 1 گرمی', 'FortiFlora Dog probiotic — 30 × 1 g sachets', 'FortiFlora Köpek probiyotik — 30 × 1 g saşe', 'purina-pro-plan', 'med-dog-supplements'),
    ('moveflex-dog-large-30', 'مکمل مفاصل مووفلکس سگ بزرگ بسته 30 عددی', 'Moveflex joint supplement, large dog — 30 tablets', 'Moveflex eklem takviyesi, büyük ırk köpek — 30 tablet', null, 'med-dog-supplements,med-joint'),
    ('moveflex-dog-medium-30', 'مکمل مفاصل مووفلکس سگ متوسط بسته 30 عددی', 'Moveflex joint supplement, medium dog — 30 tablets', 'Moveflex eklem takviyesi, orta ırk köpek — 30 tablet', null, 'med-dog-supplements,med-joint'),
    ('moveflex-dog-small-30', 'مکمل مفاصل مووفلکس سگ کوچک بسته 30 عددی', 'Moveflex joint supplement, small dog — 30 tablets', 'Moveflex eklem takviyesi, küçük ırk köpek — 30 tablet', null, 'med-dog-supplements,med-joint'),
    ('arthrovet-complex-large-90', 'مکمل مفاصل آرترووت کمپلکس نژاد بزرگ 90 قرص', 'ArthroVet Complex, large breed — 90 tablets', 'ArthroVet Complex, büyük ırk — 90 tablet', 'vet-expert', 'med-dog-supplements,med-joint'),
    ('arthrovet-complex-small-60', 'مکمل مفاصل آرترووت کمپلکس نژاد کوچک 60 کپسول', 'ArthroVet Complex, small breed — 60 capsules', 'ArthroVet Complex, küçük ırk — 60 kapsül', 'vet-expert', 'med-dog-supplements,med-joint'),
    ('effipro-duo-cat-4', 'قطره افی‌پرو دوئو گربه گربه‌های بالای 1 کیلوگرم بسته 4 پیپت', 'Effipro Duo spot-on — 4 pipettes, cats over 1 kg', 'Effipro Duo damla — 4 pipet, 1 kg üzeri kediler için', 'virbac', 'med-cat-antiparasitic'),
    ('hydra-care-cat-10', 'مکمل آب‌رسان هیدرا کر گربه 10 پوچ 85 گرمی', 'Hydra Care Cat hydration supplement — 10 × 85 g pouches', 'Hydra Care Kedi nem takviyesi — 10 × 85 g pouch', 'purina-pro-plan', 'med-cat-supplements'),
    ('fortiflora-cat-30', 'پروبیوتیک فورتی‌فلورا گربه 30 ساشه 1 گرمی', 'FortiFlora Cat probiotic — 30 × 1 g sachets', 'FortiFlora Kedi probiyotik — 30 × 1 g saşe', 'purina-pro-plan', 'med-cat-supplements'),
    ('moveflex-cat-30', 'مکمل مفاصل مووفلکس گربه بسته 30 عددی', 'Moveflex joint supplement, cat — 30 tablets', 'Moveflex eklem takviyesi, kedi — 30 tablet', null, 'med-cat-supplements,med-joint'),
    ('cet-enzymatic-toothpaste-70g', 'خمیردندان آنزیمی C.E.T. ویر‌بک 70 گرم برای سگ و گربه', 'C.E.T. Enzymatic Toothpaste Virbac — 70 g, dogs and cats', 'C.E.T. Enzimatik Diş Macunu Virbac — 70 g, köpek ve kediler için', 'virbac', 'med-dental'),
    ('sebolytic-sis-shampoo-250ml', 'شامپو سبولیتیک SIS ویر‌بک 250 میلی‌لیتر برای سگ و گربه', 'Sebolytic SIS Shampoo Virbac — 250 ml, dogs and cats', 'Sebolytic SIS Şampuan Virbac — 250 ml, köpek ve kediler için', 'virbac', 'med-skin-coat'),
    ('specialist-shampoo-vetexpert-250ml', 'شامپو اسپشیالیست وت اکسپرت 250 میلی‌لیتر برای سگ و گربه', 'Specialist Shampoo VetExpert — 250 ml, dogs and cats', 'Specialist Şampuan VetExpert — 250 ml, köpek ve kediler için', 'vet-expert', 'med-skin-coat'),
    ('vetoskin-90', 'مکمل پوست و مو وتواسکین 90 کپسول برای سگ و گربه', 'VetoSkin skin & coat supplement — 90 capsules, dogs and cats', 'VetoSkin deri ve tüy takviyesi — 90 kapsül, köpek ve kediler için', 'vet-expert', 'med-skin-coat'),
    ('nutri-plus-gel-120g', 'ژل انرژی‌زای نوتری پلاس 120 گرم برای سگ و گربه', 'Nutri-Plus Gel energy supplement — 120 g, dogs and cats', 'Nutri-Plus Jel enerji takviyesi — 120 g, köpek ve kediler için', 'virbac', 'med-general-supplements'),
    ('renalvet-60', 'مکمل کلیه رنال‌وت 60 کپسول برای سگ و گربه', 'RenalVet kidney supplement — 60 capsules, dogs and cats', 'RenalVet böbrek takviyesi — 60 kapsül, köpek ve kediler için', 'vet-expert', 'med-general-supplements'),
    ('hepatiale-forte-advanced-30', 'مکمل کبد هپاتیال فورته ادونسد وت اکسپرت 30 قرص برای سگ و گربه', 'HepatiAle Forte Advanced VetExpert liver supplement — 30 tablets', 'HepatiAle Forte Advanced VetExpert karaciğer takviyesi — 30 tablet', 'vet-expert', 'med-general-supplements'),
    ('vetomune-60', 'مکمل تقویت ایمنی وتومون 60 کپسول برای سگ و گربه', 'Vetomune immune supplement — 60 capsules, dogs and cats', 'Vetomune bağışıklık takviyesi — 60 kapsül, köpek ve kediler için', 'vet-expert', 'med-general-supplements'),
    ('pronefra-60ml', 'مکمل کلیه پرونفرا 60 میلی‌لیتر برای سگ و گربه', 'Pronefra kidney supplement — 60 ml, dogs and cats', 'Pronefra böbrek takviyesi — 60 ml, köpek ve kediler için', 'virbac', 'med-general-supplements')
  ) as p(slug, fa, en, tr, brand, cats) loop
    insert into public.products (store_id, slug, status, brand_id)
    values (v_store, v_rec.slug, 'draft',
            case when v_rec.brand is null then null
                 else (select id from public.brands where store_id = v_store and slug = v_rec.brand) end)
    on conflict (store_id, slug) do nothing;

    select id into v_pid from public.products where store_id = v_store and slug = v_rec.slug;

    insert into public.product_translations (product_id, locale, name) values
      (v_pid, 'fa', v_rec.fa), (v_pid, 'en', v_rec.en), (v_pid, 'tr', v_rec.tr)
    on conflict (product_id, locale) do nothing;

    insert into public.product_categories (product_id, category_id)
    select v_pid, c.id from public.categories c
    where c.store_id = v_store and c.slug = any (string_to_array(v_rec.cats, ','))
    on conflict (product_id, category_id) do nothing;

    -- One placeholder variant so the product is editable in the admin. Price 0 = not priced yet;
    -- the product stays 'draft', so nothing 0-priced can be bought. No stock_movements row:
    -- stock_qty already defaults to 0 and the table rejects a zero delta (check (delta <> 0)).
    if not exists (select 1 from public.product_variants where product_id = v_pid) then
      insert into public.product_variants (store_id, product_id, price, is_default, track_inventory)
      values (v_store, v_pid, 0, true, true);
    end if;
  end loop;
end $$;
