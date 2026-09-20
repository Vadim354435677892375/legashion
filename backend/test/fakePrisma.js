// Минимальная in-memory имитация PrismaClient — ровно те методы, что вызывает код под тестом.
// Нужна, чтобы гонять HTTP-тесты без настоящей БД.
export function createFakePrisma() {
  const db = {
    admins: [],
    attempts: [],
    products: [],
    orders: [],
    siteMedia: [],
    tracks: [],
    collections: [],
    nextId: 1,
  };
  const id = () => db.nextId++;

  return {
    _db: db,

    admin: {
      findUnique: async ({ where }) => db.admins.find((a) => a.id === where.id) ?? null,
      findFirst: async ({ where }) => {
        const wanted = where.email.equals.toLowerCase();
        return db.admins.find((a) => a.email.toLowerCase() === wanted) ?? null;
      },
    },

    loginAttempt: {
      count: async ({ where }) =>
        db.attempts.filter(
          (a) =>
            (where.ip === undefined || a.ip === where.ip) &&
            (where.email === undefined || a.email === where.email) &&
            (!where.createdAt?.gte || a.createdAt >= where.createdAt.gte)
        ).length,
      create: async ({ data }) => {
        db.attempts.push({ id: id(), createdAt: new Date(), ...data });
      },
      deleteMany: async ({ where }) => {
        db.attempts = db.attempts.filter((a) => {
          if (where.email !== undefined) return a.email !== where.email;
          if (where.createdAt?.lt) return !(a.createdAt < where.createdAt.lt);
          return true;
        });
      },
    },

    product: {
      findMany: async ({ where }) =>
        db.products.filter(
          (p) => where.id.in.includes(p.id) && (where.isActive === undefined || p.isActive === where.isActive)
        ),
    },

    order: {
      create: async ({ data }) => {
        const order = {
          id: id(),
          ...data,
          status: 'NEW',
          createdAt: new Date(),
          items: data.items.create.map((i) => ({ id: id(), ...i })),
        };
        db.orders.push(order);
        return order;
      },
    },

    // --- раздел «Медиа» ---

    siteMedia: {
      findMany: async () => db.siteMedia.map((r) => ({ ...r })),
      findUnique: async ({ where }) => {
        const row = db.siteMedia.find((r) => r.key === where.key);
        return row ? { ...row } : null;
      },
      upsert: async ({ where, update, create }) => {
        const row = db.siteMedia.find((r) => r.key === where.key);
        if (row) {
          Object.assign(row, update, { updatedAt: new Date() });
          return { ...row };
        }
        const created = { ...create, updatedAt: new Date() };
        db.siteMedia.push(created);
        return { ...created };
      },
      delete: async ({ where }) => {
        db.siteMedia = db.siteMedia.filter((r) => r.key !== where.key);
      },
    },

    playerTrack: {
      findMany: async () =>
        db.tracks.map((t) => ({ ...t })).sort((a, b) => a.position - b.position || a.id - b.id),
      findUnique: async ({ where }) => {
        const row = db.tracks.find((t) => t.id === where.id);
        return row ? { ...row } : null;
      },
      findFirst: async () =>
        db.tracks.length ? { ...[...db.tracks].sort((a, b) => b.position - a.position)[0] } : null,
      create: async ({ data }) => {
        const row = { id: id(), createdAt: new Date(), ...data };
        db.tracks.push(row);
        return { ...row };
      },
      update: async ({ where, data }) => {
        const row = db.tracks.find((t) => t.id === where.id);
        Object.assign(row, data);
        return { ...row };
      },
      delete: async ({ where }) => {
        db.tracks = db.tracks.filter((t) => t.id !== where.id);
      },
    },

    collection: {
      findMany: async () => db.collections.map((c) => ({ ...c })),
      findUnique: async ({ where }) => {
        const row = db.collections.find((c) =>
          where.id !== undefined ? c.id === where.id : c.slug === where.slug
        );
        return row ? { ...row } : null;
      },
      update: async ({ where, data }) => {
        const row = db.collections.find((c) => c.id === where.id);
        Object.assign(row, data);
        return { ...row };
      },
    },

    // Массив уже запущенных операций — для имитации достаточно дождаться их всех.
    $transaction: async (ops) => Promise.all(ops),
  };
}
