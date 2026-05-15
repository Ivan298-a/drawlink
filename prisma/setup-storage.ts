/**
 * Создаёт нужные Supabase Storage buckets.
 * Запуск: npm run db:storage
 *
 * Buckets:
 *   - catalog-previews  (public)  — превью работ с watermark
 *   - catalog-originals (private) — оригиналы (выдаются по signed URL после оплаты)
 *   - order-attachments (private) — методички и доказательства споров
 */
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("❌ Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type BucketSpec = {
  id: string;
  public: boolean;
  fileSizeLimit: number;
  allowedMimeTypes: string[];
};

const buckets: BucketSpec[] = [
  {
    id: "catalog-previews",
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  {
    id: "catalog-originals",
    public: false,
    fileSizeLimit: 50 * 1024 * 1024,
    allowedMimeTypes: [
      "application/pdf",
      "application/octet-stream",
      "image/jpeg",
      "image/png",
      "application/zip",
      "application/x-zip-compressed",
    ],
  },
  {
    id: "order-attachments",
    public: false,
    fileSizeLimit: 20 * 1024 * 1024,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ],
  },
];

async function main() {
  for (const spec of buckets) {
    const { data: existing } = await supabase.storage.getBucket(spec.id);
    if (existing) {
      const { error } = await supabase.storage.updateBucket(spec.id, {
        public: spec.public,
        fileSizeLimit: spec.fileSizeLimit,
        allowedMimeTypes: spec.allowedMimeTypes,
      });
      if (error) throw error;
      console.log(`↻ updated bucket: ${spec.id}`);
    } else {
      const { error } = await supabase.storage.createBucket(spec.id, {
        public: spec.public,
        fileSizeLimit: spec.fileSizeLimit,
        allowedMimeTypes: spec.allowedMimeTypes,
      });
      if (error) throw error;
      console.log(`✓ created bucket: ${spec.id}`);
    }
  }
  console.log("✅ Storage buckets готовы");
}

main().catch((e) => {
  console.error("❌", e.message ?? e);
  process.exit(1);
});
