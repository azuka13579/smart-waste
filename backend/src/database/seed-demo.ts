/**
 * Fill the database with demo users and reports so the dashboard is not empty.
 *
 *   bun run seed:demo [image-folder] [report-count]
 *
 * image-folder defaults to ../ml/data/dataset_6class/test (one sub-folder per category), report-count to 24.
 * Photos go through the same path as real uploads (classification + storage).
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { eq, sql } from "drizzle-orm";
import { ReportStatus, RolePermissions, UserRole } from "@/constants";
import { reports, users } from "@/database/schema";
import { ReportsService } from "@/http/reports/service";
import { db, Encryption, logger, type Session } from "@/modules";

const imageFolder = Bun.argv[2] ?? "../ml/data/dataset_6class/test";
const reportCount = Number(Bun.argv[3] ?? 24);

const demoUsers = [
	{ name: "Budi Santoso", email: "budi@demo.smartwaste.id" },
	{ name: "Siti Rahma", email: "siti@demo.smartwaste.id" },
	{ name: "Andi Pratama", email: "andi@demo.smartwaste.id" }
];
const demoPassword = "demo12345";

const places = [
	{ address: "Pasar Bogor, Jl. Suryakencana", latitude: -6.6027, longitude: 106.8016 },
	{ address: "Taman Sempur, Bogor Tengah", latitude: -6.5893, longitude: 106.8008 },
	{ address: "Gerbang Utama IPB Dramaga", latitude: -6.5583, longitude: 106.7302 },
	{ address: "Stasiun Bogor", latitude: -6.5952, longitude: 106.7907 },
	{ address: "Kebun Raya Bogor, pintu 3", latitude: -6.5978, longitude: 106.7996 },
	{ address: "Jl. Pajajaran dekat Botani Square", latitude: -6.6012, longitude: 106.8062 }
];

const descriptions = [
	"Tumpukan sampah di pinggir jalan, sudah beberapa hari belum diangkut",
	"Sampah berserakan di dekat tempat duduk taman",
	"Kantong sampah robek dan isinya tercecer",
	"Sampah menumpuk di saluran air, khawatir menyumbat",
	"Banyak sampah setelah acara akhir pekan"
];

const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)] as T;

async function upsertUser(data: { name: string; email: string; role: UserRole; password: string }) {
	const [existing] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.email, data.email));
	if (existing) return existing;

	const [created] = await db
		.insert(users)
		.values({ ...data, password: await Encryption.hashData(data.password) })
		.returning({ id: users.id, role: users.role });
	// biome-ignore lint/style/noNonNullAssertion: insert ... returning always yields a row
	return created!;
}

function sessionFor(user: { id: string; role: UserRole }): Session {
	return { id: "seed", userId: user.id, role: user.role, permissions: RolePermissions[user.role] };
}

async function listImages() {
	const categories = await readdir(imageFolder);
	const images: string[] = [];
	for (const category of categories) {
		const files = await readdir(join(imageFolder, category)).catch(() => []);
		images.push(...files.filter(file => /\.(jpe?g|png|webp)$/i.test(file)).map(file => join(imageFolder, category, file)));
	}
	if (images.length === 0) throw new Error(`No images found in ${imageFolder}`);
	return images;
}

const [admin] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.role, UserRole.Admin)).limit(1);
if (!admin) throw new Error("No admin account found; start the API once so it seeds the admin");

const reporters = await Promise.all(demoUsers.map(user => upsertUser({ ...user, role: UserRole.User, password: demoPassword })));
const images = await listImages();
const adminService = new ReportsService({ session: sessionFor(admin) });

for (let i = 0; i < reportCount; i++) {
	const reporter = pick(reporters);
	const place = pick(places);
	const image = pick(images);

	const report = await new ReportsService({ session: sessionFor(reporter) }).create({
		photo: new File([await Bun.file(image).arrayBuffer()], "photo.jpg", { type: "image/jpeg" }),
		description: pick(descriptions),
		latitude: place.latitude + (Math.random() - 0.5) * 0.004,
		longitude: place.longitude + (Math.random() - 0.5) * 0.004,
		address: place.address
	});

	// Spread reports over the last 14 days so the daily chart has a trend
	const daysAgo = Math.floor(Math.random() * 14);
	await db
		.update(reports)
		.set({ createdAt: sql`now() - make_interval(days => ${daysAgo}, hours => ${Math.floor(Math.random() * 10)})` })
		.where(eq(reports.id, report.id));

	// Older reports are more likely to have been handled
	const roll = Math.random() + daysAgo / 28;
	if (roll > 0.55) await adminService.updateStatus(report.id, { status: ReportStatus.InProgress, note: "Petugas menuju lokasi" });
	if (roll > 0.9) await adminService.updateStatus(report.id, { status: ReportStatus.Completed, note: "Sampah sudah diangkut" });
	else if (roll > 0.45 && roll < 0.5) await adminService.updateStatus(report.id, { status: ReportStatus.Rejected, note: "Foto tidak menunjukkan tumpukan sampah" });

	logger.info(`[seed] ${i + 1}/${reportCount} ${report.category ?? "uncategorized"} by ${reporter.id}`);
}

logger.info(`[seed] Done. Demo users: ${demoUsers.map(user => user.email).join(", ")} (password: ${demoPassword})`);
process.exit(0);
