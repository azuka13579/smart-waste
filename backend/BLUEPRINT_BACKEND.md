# Blueprint Backend — Pondasi ERP (Bun + Elysia + Drizzle + PostgreSQL)

Dokumen ini adalah **cetak biru** cara menulis backend dengan pondasi yang sama seperti `erp-backend` (MySOC).
Bisnisnya boleh berbeda (toko, klinik, sekolah, gudang, dll.), tetapi **struktur folder, alur request, penamaan, dan pola kode** mengikuti aturan di bawah.

> Bisa disalin ke project baru sebagai `CLAUDE.md` / `CONTRIBUTING.md` agar semua developer (dan AI) menulis kode dengan gaya yang sama.

Contoh domain yang dipakai di seluruh dokumen: **`products`** (Produk). Ganti dengan domain bisnis Anda.

---

## 1. Tech Stack

| Bagian | Pilihan |
| --- | --- |
| Runtime | **Bun** |
| HTTP framework | **Elysia** (`BunAdapter`, `aot: true`) + `@elysiajs/cors` + `@elysiajs/openapi` (docs di `/docs`) |
| Validasi | **Zod v4** (request, response, env) + `drizzle-zod` |
| ORM / DB | **Drizzle ORM** + driver `postgres` → **PostgreSQL** |
| Error-as-value | `@sapphire/result` (`Result.from`, `Result.fromAsync`) |
| Permission | `@sapphire/bitfield` (bitfield RBAC) |
| Logger | `pino` (+ `pino-pretty` saat dev) |
| HTTP client keluar | `ky` atau `fetch` |
| Lint/format | **Biome** |
| Git hooks | **lefthook** (pre-commit: biome, commit-msg: commitlint) |
| Commit | **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `chore:` …) |
| Test | `bun test` (file `*.test.ts` di samping file yang dites) |

---

## 2. Struktur Folder

```
backend/
├── drizzle/                     # Migrasi SQL hasil `drizzle-kit generate` (JANGAN edit manual kecuali perlu)
│   └── meta/
├── docs/                        # Dokumentasi per fitur (markdown)
├── src/
│   ├── index.ts                 # Entry point API: Elysia app, error handler, health check, registrasi controller
│   ├── worker.ts                # (opsional) Entry point kedua untuk background worker
│   ├── config.ts                # Semua env var divalidasi Zod → diekspor sebagai konstanta
│   ├── type.ts                  # Export `type app` (untuk Eden/klien bertipe)
│   │
│   ├── constants/               # Enum & konstanta bisnis, satu file per domain
│   │   ├── index.ts             # Barrel: export * from "./xxx"
│   │   ├── http.ts              # Nama cookie, header, durasi session
│   │   ├── permissions.ts       # PermissionFlags (bitfield) + PermissionBitfield
│   │   ├── roles.ts             # Division/unit, DefaultRoles, DefaultUsers (seed)
│   │   ├── route.ts             # RouteTag enum + RouteTagsMeta (grup OpenAPI)
│   │   └── product.ts           # ← enum domain: ProductStatus, dst.
│   │
│   ├── database/
│   │   ├── index.ts             # Class Database (singleton koneksi postgres)
│   │   ├── helpers.ts           # idPrimaryKey, timestamptz, updatedAt, money, defaultArray, dll.
│   │   └── schema/
│   │       ├── index.ts         # Barrel semua schema
│   │       ├── enum.ts          # pgEnum yang dibangun dari enum di constants/
│   │       ├── users/           # users, user_sessions, user_roles, divisions, roles
│   │       └── product.ts       # ← tabel domain
│   │
│   ├── http/                    # SATU FOLDER PER DOMAIN (fitur)
│   │   └── products/
│   │       ├── index.ts         # Controller (route Elysia)
│   │       ├── model.ts         # Zod schema request/response (namespace ProductsModel)
│   │       ├── service.ts       # Business logic (class ProductsService)
│   │       ├── import-csv.ts    # (opsional) helper khusus fitur
│   │       └── import-csv.test.ts
│   │
│   ├── modules/                 # Infrastruktur lintas fitur (bukan bisnis)
│   │   ├── index.ts             # Barrel
│   │   ├── database.ts          # `db` + `dbClient` + migrasi otomatis + seed role
│   │   ├── session.ts           # resolveSession, startSession, userHasAnyPermissionGuard
│   │   ├── encryptions.ts       # AES
│   │   ├── logger.ts            # pino
│   │   ├── response/            # ResponseBuilder + kontrak envelope
│   │   ├── storage/             # s3.ts, google-drive.ts
│   │   └── <integrasi>.ts       # email, notification, sso-oauth, directus, dll.
│   │
│   ├── utils/                   # Helper murni (tanpa DB): csv, date-formatter, tracking-decorator
│   └── worker/                  # (opsional) logika worker
│
├── drizzle.config.ts
├── biome.json
├── lefthook.yml
├── tsconfig.json                # path alias "@/*" → "./src/*"
├── Dockerfile
└── package.json
```

**Aturan penempatan:**

| Jenis kode | Taruh di |
| --- | --- |
| Endpoint / route | `src/http/<domain>/index.ts` |
| Query DB + aturan bisnis | `src/http/<domain>/service.ts` |
| Bentuk body/query/response | `src/http/<domain>/model.ts` |
| Definisi tabel | `src/database/schema/<domain>.ts` |
| Enum status/tipe | `src/constants/<domain>.ts` |
| Helper yang dipakai > 1 domain & butuh DB/infrastruktur | `src/modules/` |
| Helper murni tanpa side-effect | `src/utils/` |

---

## 3. Konvensi Penamaan

| Hal | Aturan | Contoh |
| --- | --- | --- |
| Nama file & folder | `kebab-case` | `fund-request/`, `health-logs/`, `import-csv.ts` |
| Folder domain di `http/` | jamak, kebab-case | `products/`, `health-logs/` |
| Nama tabel DB | `snake_case`, **jamak** | `products`, `product_categories` |
| Tabel relasi / pivot | `<a>_<b>` jamak | `product_category_links`, `todo_participants` |
| Variabel tabel di TS | `camelCase` jamak | `export const productCategories = pgTable("product_categories", …)` |
| Kolom | `camelCase` di TS → otomatis `snake_case` di DB (`casing: "snake_case"`) | `deletedAt` → `deleted_at` |
| Foreign key | `<entity>Id` | `authorId`, `categoryId` |
| Kolom waktu | `xxxAt` | `deletedAt`, `approvedAt`, `occurredAt` |
| Kolom aktor | `xxxBy` / `xxxByUserId` | `approvedBy`, `createdByUserId` |
| Enum TS | `PascalCase`, member `PascalCase`, value `snake_case` | `ProductStatus.OutOfStock = "out_of_stock"` |
| Daftar value enum | `<Enum>Values` | `export const ProductStatusValues = Object.values(ProductStatus)` |
| pgEnum | `<name>Enum`, nama DB `snake_case` | `productStatusEnum = pgEnum("product_status", ProductStatus)` |
| Controller | `<Domain>Controller` | `ProductsController` |
| Service | `<Domain>Service` | `ProductsService` |
| Model namespace | `<Domain>Model` | `ProductsModel` |
| Schema response | `xxxSchema` | `productSchema`, `productDetailSchema` |
| Schema body | `createBody`, `updateBody`, `<aksi>Body` | `createBody`, `approveBody` |
| Schema query | `listQuery`, `exportQuery`, `<aksi>Query` | `listQuery` |
| Type dari schema | **nama sama** dengan schema | `export type createBody = z.infer<typeof createBody>` |
| Instance service di context | `<domain>Service` (camelCase) | `productsService` |
| Permission flag | `UPPER_SNAKE`, kata kerja di depan | `MANAGE_PRODUCTS`, `SEND_FUND_REQUEST`, `APPROVE_WA_BROADCAST` |
| Route tag | `RouteTag.<PascalCase>` | `RouteTag.Products = "Products"` |
| Konstanta env | `camelCase` di export | `databaseUrl`, `appSecret`, `s3PublicUrl` |
| Prefix route | kebab-case, jamak; milik user pakai `/users/@me/...` | `/products`, `/users/@me/todos` |
| Route internal / integrasi | prefix `/_/` | `/_/external/verify-student` |

---

## 4. Alur Request

```
HTTP Request
   │
   ▼
src/index.ts  ── onRequest (cek shutdown, hitung activeRequests)
   │            ── cors, openapi
   ▼
<Domain>Controller  (new Elysia({ prefix, tags }))
   │  .resolve(TrackingDecorator)    → ipAddress, userAgent, requestId
   │  .resolve(resolveSession)       → session { userId, permissions, ... }  (401 jika tidak ada/expired)
   │  .resolve(() => ({ xxxService })) → instance service berisi session
   │
   ├─ validasi body/query/params (Zod di model.ts)  → gagal = 400 "Validation Error"
   ├─ beforeHandle: userHasAnyPermissionGuard([...]) → gagal = 403
   ▼
handler  →  await xxxService.method(...)
   │            └─ query Drizzle, aturan bisnis, `throw status(404, "...")` bila perlu
   ▼
ResponseBuilder.ok / created / paginated   →  { message, data, meta }
   │
   ▼
onError global (src/index.ts) mengubah semua error → { message, error }
```

**Pembagian tanggung jawab (WAJIB):**

- **Controller**: hanya routing, guard, validasi, memanggil service, membungkus response. **Tidak ada query DB di controller.**
- **Service**: semua query Drizzle, transaksi, aturan bisnis, serialisasi tanggal, lempar error HTTP via `status()`.
- **Model**: hanya schema Zod + type. Tidak ada logika.

---

## 5. Langkah Menambah Modul Baru (Checklist)

1. `src/constants/product.ts` — enum status/tipe → export di `src/constants/index.ts`
2. `src/constants/permissions.ts` — tambah flag `MANAGE_PRODUCTS` (bit berikutnya yang kosong)
3. `src/constants/roles.ts` — beri flag ke role/divisi yang berhak
4. `src/constants/route.ts` — tambah `RouteTag.Products` + entri `RouteTagsMeta`
5. `src/database/schema/product.ts` — definisi tabel → export di `schema/index.ts`
6. `bunx drizzle-kit generate` → cek SQL di `drizzle/` (migrasi jalan otomatis saat app start)
7. `src/http/products/model.ts` — `ProductsModel`
8. `src/http/products/service.ts` — `ProductsService`
9. `src/http/products/index.ts` — `ProductsController`
10. `src/index.ts` — `.use(ProductsController)`
11. (Opsional) `docs/products.md` — dokumentasi endpoint
12. `bun run check && bun run typecheck && bun test`

---

## 6. Template Kode

### 6.1 Konstanta / Enum — `src/constants/product.ts`

```ts
export enum ProductStatus {
	Draft = "draft",
	Active = "active",
	OutOfStock = "out_of_stock",
	Archived = "archived"
}

export const ProductStatusValues = Object.values(ProductStatus);
```

### 6.2 Schema Tabel — `src/database/schema/product.ts`

```ts
import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { idPrimaryKey, money, timestamptz, updatedAt } from "@/database/helpers";
import { users } from "./users";

export const products = pgTable("products", {
	id: idPrimaryKey, // UUID v7 → createdAt diturunkan dari id

	name: text().notNull(),
	description: text(),
	price: money().notNull(), // bigint, simpan satuan terkecil (rupiah)
	stock: integer().notNull().default(0),
	status: text().notNull().default("draft"), // atau pgEnum dari constants

	authorId: uuid()
		.references(() => users.id, { onDelete: "set null" }),

	deletedAt: timestamptz(), // soft delete
	updatedAt: updatedAt()
});
```

Aturan schema:
- Primary key **selalu** `id: idPrimaryKey` (UUID v7, `default uuidv7()`).
- **Tidak perlu kolom `createdAt`** — ambil dari id: ``sql<Date>`uuid_extract_timestamp(${products.id})` ``. (Gunakan helper `createdAt()` hanya jika memang perlu kolom terpisah.)
- `updatedAt: updatedAt()` otomatis terisi saat UPDATE.
- Soft delete pakai `deletedAt: timestamptz()`; filter `isNull(products.deletedAt)` di query list.
- Uang pakai `money()` (bigint, dibaca sebagai `string`).
- Array default pakai `defaultArray.text()` dll.
- Tulis kolom dalam camelCase — Drizzle mengubah ke snake_case.

### 6.3 Model — `src/http/products/model.ts`

```ts
import { createSelectSchema } from "drizzle-zod";
import z from "zod";
import { ProductStatus } from "@/constants";
import { products } from "@/database/schema/product";

export namespace ProductsModel {
	/* ── Response ───────────────────────────────────── */
	export const productSchema = createSelectSchema(products, {
		price: z.string(),
		updatedAt: z.iso.datetime().nullable(),
		deletedAt: z.iso.datetime().nullable()
	}).extend({
		createdAt: z.iso.datetime()
	});

	export type productSchema = z.infer<typeof productSchema>;

	export const productDetailSchema = productSchema.extend({
		author: z.object({ id: z.string().uuid(), name: z.string() }).nullable()
	});

	/* ── Body ───────────────────────────────────────── */
	export const createBody = z.object({
		name: z.string().min(1),
		description: z.string().optional(),
		price: z.coerce.string(),
		stock: z.number().int().min(0).default(0),
		status: z.enum(ProductStatus).default(ProductStatus.Draft)
	});

	export type createBody = z.infer<typeof createBody>;

	export const updateBody = createBody.partial().refine(data => Object.keys(data).length > 0, {
		message: "At least one field must be provided"
	});

	export type updateBody = z.infer<typeof updateBody>;

	/* ── Query ──────────────────────────────────────── */
	export const listQuery = z.object({
		search: z.string().optional(),
		status: z.enum(ProductStatus).optional(),
		page: z.coerce.number().int().positive().default(1),
		limit: z.coerce.number().int().positive().max(100).default(20)
	});

	export type listQuery = z.output<typeof listQuery>; // pakai z.output karena ada default/coerce
}
```

Aturan model:
- Response dibangun dari `createSelectSchema(table, overrides)`; kolom `Date` di-override jadi `z.iso.datetime()` karena service mengirim string ISO.
- Relasi/gabungan pakai `.extend({...})`.
- Body update = `createBody.partial().refine(...)` agar tidak boleh kosong.
- Query pagination: `page` + `limit` dengan `z.coerce` dan default.
- ID di params: `z.uuidv7()` (atau `z.string().uuid()`).

### 6.4 Service — `src/http/products/service.ts`

```ts
import { and, count, desc, eq, getTableColumns, ilike, isNull, sql } from "drizzle-orm";
import { StatusMap, status } from "elysia";
import { products } from "@/database/schema/product";
import { users } from "@/database/schema/users";
import { db } from "@/modules";
import type { ProductsModel } from "./model";

export class ProductsService {
	public constructor(
		private readonly options: {
			session: { userId: string; permissions: number };
		}
	) {}

	/* ── Private helpers ────────────────────────────── */

	private serialize(row: typeof products.$inferSelect & { createdAt: Date }) {
		return {
			...row,
			createdAt: row.createdAt.toISOString(),
			updatedAt: row.updatedAt?.toISOString() ?? null,
			deletedAt: row.deletedAt?.toISOString() ?? null
		};
	}

	private selectColumns() {
		return {
			...getTableColumns(products),
			createdAt: sql<Date>`uuid_extract_timestamp(${products.id})`
		};
	}

	/* ── Public API ─────────────────────────────────── */

	public async list(query: ProductsModel.listQuery) {
		const { page, limit, search, status: productStatus } = query;
		const offset = (page - 1) * limit;

		const filters = [
			isNull(products.deletedAt),
			search ? ilike(products.name, `%${search}%`) : undefined,
			productStatus ? eq(products.status, productStatus) : undefined
		].filter(Boolean);
		const whereClause = and(...filters);

		const [totalResult] = await db.select({ total: count() }).from(products).where(whereClause);
		const total = totalResult?.total ?? 0;

		const rows = await db.select(this.selectColumns()).from(products).where(whereClause).orderBy(desc(products.id)).limit(limit).offset(offset);

		return {
			products: rows.map(row => this.serialize(row)),
			pagination: {
				page,
				perPage: limit,
				total,
				totalPages: Math.max(1, Math.ceil(total / limit))
			}
		};
	}

	public async getById(id: string) {
		const [row] = await db
			.select({ ...this.selectColumns(), author: { id: users.id, name: users.name } })
			.from(products)
			.leftJoin(users, eq(products.authorId, users.id))
			.where(and(eq(products.id, id), isNull(products.deletedAt)));

		if (!row) throw status(StatusMap["Not Found"], "Product not found");

		return { ...this.serialize(row), author: row.author };
	}

	public async create(data: ProductsModel.createBody) {
		const [row] = await db
			.insert(products)
			.values({ ...data, authorId: this.options.session.userId })
			.returning({ id: products.id });

		if (!row) throw status(StatusMap["Internal Server Error"], "Failed to create product");

		return this.getById(row.id);
	}

	public async update(id: string, data: ProductsModel.updateBody) {
		const [row] = await db
			.update(products)
			.set(data)
			.where(and(eq(products.id, id), isNull(products.deletedAt)))
			.returning({ id: products.id });

		if (!row) throw status(StatusMap["Not Found"], "Product not found");

		return this.getById(row.id);
	}

	public async delete(id: string) {
		await db.update(products).set({ deletedAt: new Date() }).where(eq(products.id, id));
	}
}
```

Aturan service:
- **Class instance** dengan constructor `{ session }` → semua method tahu siapa aktornya (`this.options.session.userId`).
- Layanan tanpa session (misal untuk API eksternal) boleh `new XxxService()` tanpa argumen; helper statis murni boleh `abstract class` + `static`.
- Method publik pakai kata kerja standar: `list`, `getById`, `create`, `update`, `delete`, lalu aksi bisnis: `approve`, `reject`, `assign`, `export`, `importCsv`, `listMyScope`.
- Error dilempar dengan `throw status(StatusMap["Not Found"], "Pesan")` — ditangkap `onError` global.
- Semua `Date` diubah ke ISO string di method `serialize*` privat sebelum dikembalikan.
- List mengembalikan `{ <items>, pagination }` agar controller bisa memanggil `ResponseBuilder.paginated`.
- Gunakan `db.transaction(async tx => {...})` untuk operasi multi-tabel.
- Hindari N+1: ambil relasi dengan `inArray` sekali, lalu gabungkan di memori (lihat pola `withRelations`).
- Service boleh memanggil service lain / modul di `src/modules`.

### 6.5 Controller — `src/http/products/index.ts`

```ts
import Elysia, { status, t } from "elysia";
import z from "zod";
import { PermissionFlags, RouteTag } from "@/constants";
import { resolveSession, userHasAnyPermissionGuard } from "@/modules";
import { ResponseBuilder, ResponseErrorSchema, SuccessResponseSchema } from "@/modules/response/response";
import { TrackingDecorator } from "@/utils/tracking-decorator";
import { ProductsModel } from "./model";
import { ProductsService } from "./service";

export const ProductsController = new Elysia({ prefix: "/products", tags: [RouteTag.Products] })
	.resolve(TrackingDecorator)
	.resolve(resolveSession)
	.resolve(options => ({
		productsService: new ProductsService({ session: options.session })
	}))
	.get(
		"/",
		async ({ query, productsService }) => {
			const result = await productsService.list(query);
			return ResponseBuilder.paginated(result.products, result.pagination);
		},
		{
			detail: { description: "List products with pagination and filters." },
			query: ProductsModel.listQuery,
			response: { 200: SuccessResponseSchema(ProductsModel.productSchema.array()), 401: ResponseErrorSchema }
		}
	)
	.get("/:id", async ({ params: { id }, productsService }) => ResponseBuilder.ok(await productsService.getById(id)), {
		detail: { description: "Get product detail." },
		params: z.object({ id: z.uuidv7() }),
		response: { 200: SuccessResponseSchema(ProductsModel.productDetailSchema), 401: ResponseErrorSchema, 404: ResponseErrorSchema }
	})
	.post("/", async ({ body, productsService }) => status(201, ResponseBuilder.created(await productsService.create(body))), {
		detail: { description: "Create product." },
		beforeHandle: userHasAnyPermissionGuard([PermissionFlags.MANAGE_PRODUCTS]),
		body: ProductsModel.createBody,
		response: { 201: SuccessResponseSchema(ProductsModel.productDetailSchema), 400: ResponseErrorSchema, 401: ResponseErrorSchema, 403: ResponseErrorSchema }
	})
	.patch("/:id", async ({ params: { id }, body, productsService }) => ResponseBuilder.ok(await productsService.update(id, body)), {
		detail: { description: "Update product." },
		beforeHandle: userHasAnyPermissionGuard([PermissionFlags.MANAGE_PRODUCTS]),
		params: z.object({ id: z.uuidv7() }),
		body: ProductsModel.updateBody,
		response: { 200: SuccessResponseSchema(ProductsModel.productDetailSchema), 400: ResponseErrorSchema, 401: ResponseErrorSchema, 403: ResponseErrorSchema, 404: ResponseErrorSchema }
	})
	.delete(
		"/:id",
		async ({ params: { id }, productsService }) => {
			await productsService.delete(id);
			return status(204);
		},
		{
			detail: { description: "Soft-delete product." },
			beforeHandle: userHasAnyPermissionGuard([PermissionFlags.MANAGE_PRODUCTS]),
			params: z.object({ id: z.uuidv7() }),
			response: { 204: t.Void(), 401: ResponseErrorSchema, 403: ResponseErrorSchema }
		}
	);
```

Aturan controller:
- Urutan `.resolve`: **TrackingDecorator → resolveSession → service**.
- Setiap route punya `detail.description`, schema `body`/`query`/`params`, dan **semua** kemungkinan status di `response` (agar OpenAPI lengkap).
- Endpoint tulis (POST/PUT/PATCH/DELETE) diberi `beforeHandle: userHasAnyPermissionGuard([...])`. ADMINISTRATOR otomatis lolos.
- Status code: `200` baca/update, `201` create (`status(201, ResponseBuilder.created(...))`), `204` delete (`status(204)` + `t.Void()`).
- **Urutan route**: path statis (`/types`, `/export`, `/my-scope`) **sebelum** path dinamis (`/:id`).
- Sub-resource: `/products/:id/variants`, aksi: `POST /products/:id/approve`.
- Endpoint milik user login: prefix `/users/@me/<resource>`.
- Endpoint untuk sistem lain (API key, tanpa session): prefix `/_/...` + `.guard({ beforeHandle: verifyApiKey }, app => ...)`.

### 6.6 Registrasi — `src/index.ts`

```ts
import { ProductsController } from "./http/products";
// ...
	.use(ProductsController);
```

### 6.7 Route Tag — `src/constants/route.ts`

```ts
export enum RouteTag {
	// ...
	Products = "Products"
}

export const RouteTagsMeta = [
	// ...
	{ name: RouteTag.Products, description: "Product management routes" }
];
```

---

## 7. Autentikasi & RBAC

### Session
- Login via SSO (OIDC) atau password → `startSession()` membuat token `AES(userId:uuidv7, APP_SECRET)` dan menyimpannya di tabel `user_sessions`.
- Token dikirim sebagai cookie httpOnly (`Cookies.Session`, misal `"<app>.session"`), umur `SessionExpirationDays`.
- `resolveSession` men-decrypt cookie → cek DB → cek expired → mengembalikan `session` + `permissions` hasil gabungan semua role user.

### Permission (bitfield)
`src/constants/permissions.ts`:

```ts
const basePermissionFlags = Object.freeze({
	ADMINISTRATOR: 1 << 0, // wildcard, selalu bit 0
	MANAGE_DIVISIONS: 1 << 1,
	// ... domain
	MANAGE_PRODUCTS: 1 << 5
});
```

- Bit 0–30 di `basePermissionFlags`. **Bit ≥ 31** wajib di `EXTRA_PERMISSION_FLAGS` sebagai `BigInt` (`1n << 31n`) karena operasi bitwise JS hanya 32-bit — `PermissionBitfield.has/resolve/toArray` sudah menangani keduanya.
- **Jangan pernah mengubah/menggeser bit yang sudah dipakai** (nilainya tersimpan di DB). Tambahkan bit baru saja.
- Pengelompokan nama: `MANAGE_X` (CRUD/admin), `SEND_X` (mengajukan), `APPROVE_X` / `REVIEW_X` (menyetujui), `ASSIGN_X` (menugaskan).
- Daftar flag ini **harus disalin identik** ke frontend (`src/lib/modules/permissions.ts`).

### Role & Divisi
`src/constants/roles.ts`:
- `Division` — daftar unit/divisi (`{ code, name }`), di-seed otomatis ke tabel `divisions`.
- `RoleId` — UUID tetap untuk role default.
- `DefaultRoles` — `{ name, divisionCode, permissions: PermissionBitfield.resolve([...]) }`, di-upsert otomatis setelah migrasi (`modules/database.ts`).
- `DefaultUsers` — user admin awal.

### Scope berbasis data (row-level)
Jika akses tergantung data (misal "hanya kelompok yang saya bimbing"), buat helper di `src/modules/<x>-scope.ts` dengan pola:
`assertXxxAccess(session)` / `getXxxIds(session)` → lempar `status(403, "...")` bila tidak berhak, ADMINISTRATOR selalu lolos.

---

## 8. Format Response & Error

Semua response memakai `ResponseBuilder` (`src/modules/response/`):

```jsonc
// Sukses
{ "message": "OK", "data": { ... }, "meta": null }

// Sukses + pagination
{ "message": "OK", "data": [ ... ], "meta": { "pagination": { "page": 1, "perPage": 20, "total": 57, "totalPages": 3 } } }

// Error
{ "message": "Product not found" }

// Error validasi (400)
{ "message": "Validation Error", "error": [ { "summary": "...", "path": "/name", "message": "...", "value": "" } ] }
```

| Kebutuhan | Pakai |
| --- | --- |
| Baca / update | `ResponseBuilder.ok(data)` |
| Create | `status(201, ResponseBuilder.created(data))` |
| List berhalaman | `ResponseBuilder.paginated(items, pagination)` / `paginatedFrom(items, page, perPage, total)` |
| Hapus | `status(204)` |
| Error dari service | `throw status(StatusMap["Not Found"], "Pesan")` |
| Schema OpenAPI | `SuccessResponseSchema(xxxSchema)`, `ResponseErrorSchema` |

`onError` global di `src/index.ts` menormalkan semua error (validasi, 404, 500, error kustom) ke format di atas. Pesan error 500 detail hanya muncul saat development.

---

## 9. Konfigurasi (`src/config.ts`)

```ts
const env = z.object({
	SERVER_PORT: z.coerce.number().default(8080),
	APP_SECRET: z.string().min(32),
	DATABASE_URL: z.url(),
	S3_BUCKET_NAME: z.string(),
	FEATURE_X_API_KEY: z.string().optional()
	// ...
}).parse(process.env);

export const serverPort = env.SERVER_PORT;
export const appSecret = env.APP_SECRET;
export const databaseUrl = env.DATABASE_URL;
```

- **Semua** env var lewat sini dan divalidasi saat start (app gagal start jika env salah).
- Kode lain mengimpor konstanta camelCase (`databaseUrl`), **bukan** `process.env` langsung.
- `isDevelopment`, `logLevel`, `corsOrigin` diturunkan di file ini.

---

## 10. Database & Migrasi

- `src/modules/database.ts` mengekspor `db` (Drizzle) dan `dbClient` (postgres mentah).
- Saat start: ambil **advisory lock** → jalankan migrasi folder `drizzle/` → seed `Division` & `DefaultRoles`. Pod lain yang tidak dapat lock melewati migrasi. Bisa dilewati dengan flag `--no-migrations`.
- Alur perubahan skema: ubah `src/database/schema/*.ts` → `bunx drizzle-kit generate` → review SQL → commit file migrasi + `meta/`.
- Nama file migrasi boleh di-rename agar deskriptif (`0014_store_scan_logs.sql`) — sesuaikan juga `_journal.json`.

---

## 11. Integrasi & Modul Infrastruktur

Satu file per integrasi di `src/modules/`, diekspor via barrel `modules/index.ts`:

| Modul | Fungsi |
| --- | --- |
| `storage/s3.ts` | Upload/presigned URL ke S3/R2 (Bun `S3Client`) |
| `storage/google-drive.ts` | Arsip dokumen |
| `email.ts`, `notification.ts` | Kirim email / push / WA via service eksternal |
| `sso-oauth.ts`, `google-oauth.ts` | OAuth |
| `<service-eksternal>.ts` | Wrapper HTTP ke API pihak ketiga; baca token dari `config.ts`, ubah error eksternal → `status(...)` |

Pola wrapper eksternal: fungsi `ensureXxxToken()` (lempar 500 bila env kosong) + `xxxFetch<T>(path, body)` yang menormalkan error.

---

## 12. Background Worker (opsional)

Untuk pekerjaan lama (scraping, generate PDF massal, sinkronisasi):
- Entry point kedua `src/worker.ts`, script `start:worker` / `dev:worker`; memakai ulang `config`, `db`, `modules`.
- Antrean pakai **PostgreSQL** (tanpa Redis): tabel `xxx_jobs` + `xxx_tasks`, klaim dengan `FOR UPDATE SKIP LOCKED`, kolom heartbeat untuk memulihkan job macet, retry = insert task baru dengan `attempt + 1`.
- Status job: `WAITING → PROCESSING → SUCCESS | SUCCESS_WITH_ERROR | FAILED | CANCELLED`.
- Graceful shutdown pada `SIGTERM`.

---

## 13. Tooling & Gaya Kode

`biome.json` (inti):

```jsonc
{
	"formatter": { "indentStyle": "tab", "lineEnding": "lf" },
	"javascript": {
		"formatter": { "semicolons": "always", "trailingCommas": "none", "quoteStyle": "double", "arrowParentheses": "asNeeded", "indentWidth": 1, "lineWidth": 200 }
	},
	"linter": { "rules": { "recommended": true, "complexity": { "noStaticOnlyClass": "off" }, "suspicious": { "noExplicitAny": "off" } } }
}
```

`lefthook.yml`:

```yaml
pre-commit:
  commands:
    check:
      glob: "*.{js,ts,json,jsonc}"
      run: bun check --write --no-errors-on-unmatched --files-ignore-unknown=true {staged_files}
      stage_fixed: true
commit-msg:
  commands:
    commitlint:
      run: bun commitlint --edit {1}
```

Script `package.json`:

```jsonc
{
	"dev": "bun run --watch --hot src/index.ts | pino-pretty -c",
	"start": "bun run src/index.ts",
	"check": "biome check",
	"typecheck": "tsc --noEmit",
	"test": "bun test",
	"prepare": "lefthook install"
}
```

- Import selalu pakai alias `@/` untuk lintas folder; relatif (`./model`) hanya di dalam folder domain yang sama.
- Import type pakai `import type { XxxModel } from "./model"` di service.
- Test ditaruh di samping file (`import-csv.test.ts`), fokus ke logika murni (parser CSV, kripto, hierarki).

---

## 14. Do & Don't

✅ **Lakukan**
- Satu domain = satu folder `http/<domain>` dengan trio `index.ts` / `service.ts` / `model.ts`.
- Validasi semua input & output dengan Zod.
- Pakai `ResponseBuilder` untuk setiap response.
- Lempar error HTTP dari service dengan `status()`.
- Serialisasi `Date` → ISO string di service.
- Tambah permission baru di bit yang belum dipakai, lalu sinkronkan ke frontend.

❌ **Hindari**
- Query DB di controller.
- Membaca `process.env` di luar `config.ts`.
- Mengubah nilai bit permission yang sudah ada.
- Menaruh route `/:id` sebelum route statis.
- Mengembalikan objek mentah tanpa envelope `{ message, data, meta }`.
- Menulis migrasi manual tanpa memperbarui schema TS.
