"""Susun dataset Kaggle "Recyclable and Household Waste Classification" menjadi 6 kelas.

Hasil:
    <out>/train|val|test/<kelas>/<subfolder>__<default|real_world>__<nama>.jpg
    <out>/manifest.csv
    <out>.zip (kecuali --no-zip)

Setiap kelas diambil seimbang (--per-class foto), dibagi rata ke tiap subfolder dan
ke foto default/real_world, lalu dibagi train/val/test di dalam tiap kelompok itu
supaya proporsinya sama di ketiga split.

Contoh:
    python scripts/prepare_dataset.py
    python scripts/prepare_dataset.py --per-class 30 --out data/sample --no-zip
"""

import argparse
import csv
import random
import shutil
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

ML_DIR = Path(__file__).resolve().parent.parent

CLASSES = {
    "plastic": [
        "plastic_water_bottles",
        "plastic_soda_bottles",
        "plastic_detergent_bottles",
        "plastic_shopping_bags",
        "plastic_trash_bags",
        "plastic_food_containers",
        "disposable_plastic_cutlery",
        "plastic_straws",
        "plastic_cup_lids",
    ],
    "paper": [
        "newspaper",
        "office_paper",
        "magazines",
        "cardboard_boxes",
        "cardboard_packaging",
    ],
    "glass": [
        "glass_beverage_bottles",
        "glass_food_jars",
        "glass_cosmetic_containers",
    ],
    "metal": [
        "aluminum_soda_cans",
        "aluminum_food_cans",
        "steel_food_cans",
        "aerosol_cans",
    ],
    "organic": [
        "food_waste",
        "eggshells",
        "coffee_grounds",
        "tea_bags",
    ],
    "textile": [
        "clothing",
        "shoes",
    ],
}
# Tidak dipakai: paper_cups, styrofoam_cups, styrofoam_food_containers (bahan campuran).

VARIANTS = ["default", "real_world"]
SPLITS = {"train": 0.70, "val": 0.15, "test": 0.15}


def split_quota(total, parts):
    """Bagi `total` ke `parts` bagian serata mungkin, sisa dibagikan ke bagian awal."""
    base, rest = divmod(total, parts)
    return [base + (1 if i < rest else 0) for i in range(parts)]


def split_files(files):
    """Bagi list ke train/val/test sesuai SPLITS."""
    n = len(files)
    n_val = round(n * SPLITS["val"])
    n_test = round(n * SPLITS["test"])
    n_train = n - n_val - n_test
    return {
        "train": files[:n_train],
        "val": files[n_train : n_train + n_val],
        "test": files[n_train + n_val :],
    }


def plan_jobs(src, out, per_class, rng):
    jobs = []
    for cls, subfolders in CLASSES.items():
        # (urutan relatif di kelompoknya, acak pemecah seri, file, subfolder, variant)
        items = []
        sub_quotas = split_quota(per_class, len(subfolders))
        for sub, sub_quota in zip(subfolders, sub_quotas):
            for variant, quota in zip(VARIANTS, split_quota(sub_quota, len(VARIANTS))):
                folder = src / sub / variant
                files = sorted(folder.glob("*.png"))
                if len(files) < quota:
                    raise SystemExit(f"{folder}: butuh {quota} foto, hanya ada {len(files)}")
                picked = rng.sample(files, quota)
                items += [((i + 0.5) / quota, rng.random(), f, sub, variant) for i, f in enumerate(picked)]
        # Urut berdasarkan posisi relatif agar tiap kelompok tersebar proporsional ke semua split,
        # sementara jumlah per split dihitung di level kelas.
        items.sort()
        for split, split_items in split_files(items).items():
            for _, _, f, sub, variant in split_items:
                dest = out / split / cls / f"{sub}__{variant}__{f.stem}.jpg"
                jobs.append((f, dest, split, cls, sub, variant))
    return jobs


def convert(job, size):
    src, dest = job[0], job[1]
    with Image.open(src) as img:
        img.convert("RGB").resize((size, size), Image.LANCZOS).save(dest, quality=90)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--src", type=Path, default=ML_DIR / "data" / "images")
    parser.add_argument("--out", type=Path, default=ML_DIR / "data" / "dataset_6class")
    parser.add_argument("--per-class", type=int, default=1000)
    parser.add_argument("--size", type=int, default=224)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--no-zip", action="store_true")
    args = parser.parse_args()

    if args.out.exists():
        shutil.rmtree(args.out)
    for split in SPLITS:
        for cls in CLASSES:
            (args.out / split / cls).mkdir(parents=True)

    jobs = plan_jobs(args.src, args.out, args.per_class, random.Random(args.seed))
    print(f"Memproses {len(jobs)} foto ...")
    with ThreadPoolExecutor() as pool:
        list(pool.map(lambda j: convert(j, args.size), jobs))

    with open(args.out / "manifest.csv", "w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["split", "class", "subfolder", "variant", "file", "source"])
        for src, dest, split, cls, sub, variant in jobs:
            writer.writerow([split, cls, sub, variant, dest.relative_to(args.out).as_posix(), src.relative_to(args.src).as_posix()])

    print(f"{'kelas':<10}" + "".join(f"{s:>8}" for s in SPLITS))
    for cls in CLASSES:
        counts = [sum(1 for j in jobs if j[2] == s and j[3] == cls) for s in SPLITS]
        print(f"{cls:<10}" + "".join(f"{c:>8}" for c in counts))

    if not args.no_zip:
        archive = shutil.make_archive(str(args.out), "zip", root_dir=args.out)
        size_mb = Path(archive).stat().st_size / 1024 / 1024
        print(f"Zip: {archive} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
