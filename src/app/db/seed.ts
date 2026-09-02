import prisma from "../../shared/prisma";

// Initial seed categories
const SEED_CATEGORIES = [
  {
    name: "FB ACCOUNTS HAS ALREADY CREATED PAGE",
    slug: "fb-accounts-has-already-created-page",
    icon: "/assets/iconDBKJ_062fb7.png",
    group: "FACEBOOK",
    sortOrder: 1,
  },
  {
    name: "FACEBOOK CAN CREATE MORE OTHER PROFILE",
    slug: "facebook-can-create-more-other-profile",
    icon: "/assets/O80G_a07446.png",
    group: "FACEBOOK",
    sortOrder: 2,
  },
  {
    name: "USA FACEBOOK",
    slug: "usa-facebook",
    icon: "/assets/A7DU_3b7250.png",
    group: "FACEBOOK",
    sortOrder: 3,
  },
  {
    name: "BUY ALL COUNTRY AGED 2FA FB ACCOUNTS GOOD FRIENDS",
    slug: "buy-all-country-aged-2fa-fb-accounts-good-friends",
    icon: "/assets/iconDWZT_a9cadd.png",
    group: "FACEBOOK",
    sortOrder: 4,
  },
  {
    name: "ASIA FACEBOOK",
    slug: "asia-facebook",
    icon: "/assets/icon0OWN_849d78.png",
    group: "FACEBOOK",
    sortOrder: 5,
  },
  {
    name: "Canada Facebook Accounts",
    slug: "canada-facebook-accounts",
    icon: "/assets/iconUQCM_06d6f3.png",
    group: "FACEBOOK",
    sortOrder: 6,
  },
  {
    name: "Europe Facebook Accounts",
    slug: "europe-facebook-accounts",
    icon: "/assets/icon9W5X_574af5.png",
    group: "FACEBOOK",
    sortOrder: 7,
  },
  {
    name: "Good Quality TikTok Accounts",
    slug: "good-quality-tiktok-accounts",
    icon: "/assets/icon03XC_6bea9f.png",
    group: "TIKTOK",
    sortOrder: 8,
  },
  {
    name: "TikTok Accounts with High Followers",
    slug: "tiktok-accounts-with-high-followers",
    icon: "/assets/iconC9WT_6c02d6.png",
    group: "TIKTOK",
    sortOrder: 9,
  },
  {
    name: "Twitter (X) Accounts with High Followers",
    slug: "twitter-x-accounts-with-high-followers",
    icon: "/assets/icon6UVI_c8e4fc.png",
    group: "TWITTER",
    sortOrder: 10,
  },
  {
    name: "OLD INSTAGRAM SCAN",
    slug: "old-instagram-scan",
    icon: "/assets/iconAZP0_23636f.png",
    group: "INSTAGRAM",
    sortOrder: 11,
  },
  {
    name: "Telegram Premium",
    slug: "telegram-premium",
    icon: "/assets/icon9OR0_394df2.png",
    group: "TELEGRAM",
    sortOrder: 12,
  },
];

const SEED_PRODUCTS = [
  {
    title: "USA country NAME NEW FACEB00K( 50+ friend )( YEAR 2025 2026)",
    slug: "usa-country-name-new-faceb00k-50-friend-year-2025-2026",
    categorySlug: "fb-accounts-has-already-created-page",
    description: "USA high quality Facebook accounts with 50+ active friends.",
    features: ["PAGE NAME USA", "YOU CAN CHANE NAME", "GOOD ACCOUNT", "Aged 20 day to one year"],
    nation: "US",
    nationFlag: "/assets/us_5fe98e.png",
    priceUSD: 0.62,
    previewUid: true,
    format: "UID|PASS|2FA|EMAIL|PASS_EMAIL|EMAIL_RECOVERY",
    stockSampleCount: 15,
  },
  {
    title: "Asia cp mail very old strong facebook account 2010 to 2018 0 to 50 freinds",
    slug: "asia-cp-mail-very-old-strong-facebook-account-2010-to-2018",
    categorySlug: "facebook-can-create-more-other-profile",
    description: "Strong aged Facebook account with email access.",
    features: ["can creat another profile page", "0 to 50 freinds", "format: uid|Pass|Email|Passemail|revoveryemail"],
    nation: "ZA",
    nationFlag: "/assets/za_bb204a.png",
    priceUSD: 0.90,
    previewUid: false,
    format: "UID|PASS|EMAIL|PASS_EMAIL|RECOVERY_EMAIL",
    stockSampleCount: 10,
  },
  {
    title: "Asia 30-5000 friends can creat profile page cp mail",
    slug: "asia-30-5000-friends-can-creat-profile-page-cp-mail",
    categorySlug: "facebook-can-create-more-other-profile",
    description: "Multi-friend Asian accounts with profile creation permissions.",
    features: ["FORMAT Uid|Pass|Email|Pass email|recovery email"],
    nation: "PK",
    nationFlag: "/assets/pk_8388b7.png",
    priceUSD: 1.15,
    previewUid: false,
    format: "UID|PASS|EMAIL|PASS_EMAIL|RECOVERY_EMAIL",
    stockSampleCount: 12,
  },
  {
    title: "Canada aged 2007 to 2020 full verify on email good quality accounts",
    slug: "canada-aged-2007-to-2020-full-verify-on-email-good-quality-accounts",
    categorySlug: "canada-facebook-accounts",
    description: "High tier aged Canadian Facebook accounts with email.",
    features: ["Aged 2007-2020", "Full Email Verified", "2FA Protected"],
    nation: "CA",
    nationFlag: "/assets/ca_2cae4a.png",
    priceUSD: 2.20,
    previewUid: true,
    format: "UID|PASS|2FA|EMAIL|PASS_EMAIL",
    stockSampleCount: 8,
  },
  {
    title: "PURE ITLY AGED 2007 TO 2014 FULL VERIFY ON EMAIL 30 TO 100 FRIENDS",
    slug: "pure-itly-aged-2007-to-2014-full-verify-on-email",
    categorySlug: "europe-facebook-accounts",
    description: "European aged profiles with real friends.",
    features: ["Aged 2007-2014", "Italy IP", "Friends: 30-100"],
    nation: "IT",
    nationFlag: "/assets/it_545803.png",
    priceUSD: 3.50,
    previewUid: true,
    format: "UID|PASS|2FA|EMAIL|PASS_EMAIL",
    stockSampleCount: 6,
  },
  {
    title: "Telegram Premium USA 1 Year Subscription Country",
    slug: "telegram-premium-usa-1-country",
    categorySlug: "telegram-premium",
    description: "Full 1 year active Telegram Premium accounts.",
    features: ["1 Year Valid", "Star Badge Enabled", "Direct Login Session"],
    nation: "US",
    nationFlag: "/assets/us_5fe98e.png",
    priceUSD: 14.50,
    previewUid: false,
    format: "PHONE|SESSION_STRING|TDATA",
    stockSampleCount: 5,
  },
];

export const seedDatabase = async () => {
  let createdCatCount = 0;
  let createdProdCount = 0;
  let createdStockCount = 0;

  // 1. Seed Categories
  const categoryMap = new Map<string, string>(); // slug -> id

  for (const cat of SEED_CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (!existing) {
      const created = await prisma.category.create({ data: cat });
      categoryMap.set(cat.slug, created.id);
      createdCatCount++;
    } else {
      categoryMap.set(cat.slug, existing.id);
    }
  }

  // 2. Seed Products & Initial Vault Stock
  for (const prod of SEED_PRODUCTS) {
    const categoryId = categoryMap.get(prod.categorySlug);
    if (!categoryId) continue;

    let existingProd = await prisma.product.findUnique({ where: { slug: prod.slug } });
    if (!existingProd) {
      existingProd = await prisma.product.create({
        data: {
          categoryId,
          title: prod.title,
          slug: prod.slug,
          description: prod.description,
          features: prod.features,
          nation: prod.nation,
          nationFlag: prod.nationFlag,
          priceUSD: prod.priceUSD,
          priceNGN: prod.priceUSD * 1550,
          previewUid: prod.previewUid,
          format: prod.format,
        },
      });
      createdProdCount++;

      // Create sample vault inventory
      const sampleStock = Array.from({ length: prod.stockSampleCount }).map((_, i) => ({
        productId: existingProd!.id,
        credentials: `1000847${Math.floor(100000 + Math.random() * 900000)}|Pass#${Math.floor(1000 + Math.random() * 9000)}|JBSWY3DPEHPK3PXP|user_${i}_${prod.nation.toLowerCase()}@hotmail.com|PassMail#8291|rec_${i}@gmail.com`,
        previewData: `1000847${Math.floor(100000 + Math.random() * 900000)}`,
        status: "AVAILABLE" as const,
      }));

      const stockResult = await prisma.stockItem.createMany({
        data: sampleStock,
      });
      createdStockCount += stockResult.count;
    }
  }

  // 3. Seed Articles & Tutorials
  const blogCount = await prisma.blog.count();
  if (blogCount === 0) {
    await prisma.blog.createMany({
      data: [
        {
          title: "How to Safely Login to 2FA Facebook Accounts Without Checkpoint",
          slug: "how-to-safely-login-to-2fa-facebook-accounts-without-checkpoint",
          category: "Tutorials",
          thumbnail: "/assets/logo.png",
          excerpt: "Learn how to use 2FA secret keys via 2fa.live and configure anti-detect browsers (AdsPower, Dolphin) to safely manage aged Facebook accounts.",
          content: `### Introduction\n\nWhen purchasing aged or verified Facebook accounts from Smvaults, each credential string includes a 2FA secret key. Logging in correctly ensures your account remains healthy and never triggers unexpected security checkpoints.\n\n### Step-by-Step Login Process\n\n1. **Use an Anti-Detect Browser**: Always use tools like AdsPower, Dolphin{anty}, or Incogniton with a clean residential proxy matching the account's country (e.g., France, USA, or Belgium).\n2. **Enter Username & Password**: Paste the UID as the username and the provided password.\n3. **Extract 6-Digit 2FA Code**: Open [https://2fa.live](https://2fa.live), paste the 2FA secret key, and copy the live 6-digit verification code.\n4. **Warm Up**: Do not immediately run heavy ads. Spend the first 24-48 hours casually browsing the newsfeed and liking organic posts.`,
          author: "Smvaults Security Team",
          views: 1420,
          isPublished: true,
        },
        {
          title: "Understanding Account Formats: UID, 2FA, Hotmail & Cookies",
          slug: "understanding-account-formats-uid-2fa-hotmail-cookies",
          category: "Security",
          thumbnail: "/assets/logo.png",
          excerpt: "A comprehensive breakdown of credential strings like UID|Pass|2FA|Mail|MailPass and how to access recovery emails.",
          content: `### Deciphering the Smvaults Credential String\n\nAll automated vault deliveries in Smvaults follow standard industry formatting separated by pipe (\`|\`) delimiters:\n\n\`\`\`text\nUID | Password | 2FA Secret Key | Recovery Mail | Mail Password\n\`\`\`\n\n- **UID**: The Facebook User ID (numeric profile identifier).\n- **Password**: The primary account access password.\n- **2FA Key**: Base32 secret for Google Authenticator or 2fa.live.\n- **Recovery Email**: The linked Hotmail/Outlook/Mail.tm webmail for password resets.\n- **Mail Password**: Direct credentials to access webmail inbox.`,
          author: "Vault Operations",
          views: 980,
          isPublished: true,
        },
        {
          title: "How to Deposit USDT via Tron (TRC-20) and Korapay Africa",
          slug: "how-to-deposit-usdt-via-tron-trc20-and-korapay-africa",
          category: "Billing",
          thumbnail: "/assets/logo.png",
          excerpt: "Everything you need to know about recharging your Smvaults balance using crypto USDT and local African Naira payments.",
          content: `### Fast & Secure Payments on Smvaults\n\nWe provide two seamless ways to fund your account:\n\n1. **Crypto USDT (TRC-20 / BEP-20)**: Low fees, instant automated confirmation after 1-3 network blocks.\n2. **Korapay Africa**: Native support for Nigerian Naira (NGN), mobile money, and African bank transfers at live conversion rates.`,
          author: "Billing Support",
          views: 650,
          isPublished: true,
        },
      ],
    });
  }

  // 4. Seed Active Promo Codes
  const couponCount = await prisma.coupon.count();
  if (couponCount === 0) {
    await prisma.coupon.createMany({
      data: [
        {
          code: "WELCOME10",
          discountPercent: 10,
          minSpend: 5.0,
          maxUses: 500,
          isActive: true,
        },
        {
          code: "SMV20",
          discountPercent: 20,
          minSpend: 10.0,
          maxUses: 200,
          isActive: true,
        },
      ],
    });
  }

  return {
    categoriesCreated: createdCatCount,
    productsCreated: createdProdCount,
    stockItemsCreated: createdStockCount,
    message: "Catalog, inventory, blogs & coupons seeded successfully!",
  };
};
