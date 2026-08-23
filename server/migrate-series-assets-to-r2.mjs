import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import TestSeries from "./models/TestSeries.mjs";
import { getPresignedUploadUrl } from "./utils/r2.mjs";

const assetsDir = path.resolve(process.cwd(), "..", "mobile", "assets");
const assets = [
  ["math.png", /math|quant|percentage|arithmetic|algebra|geometry|mensuration|trigonometry/i],
  ["geography.png", /geograph/i],
  ["ecology.png", /ecolog|environment/i],
  ["economy.png", /econom/i],
  ["history.png", /histor/i],
  ["indian-constitution.png", /polity|constitution/i],
  ["Science & technology.png", /science.*technology/i],
  ["Physics.png", /physics/i],
  ["chemistry.png", /chemistry/i],
  ["biology.png", /biology/i],
  ["computer.png", /computer/i],
  ["sports.png", /sport/i],
  ["arts & culture.png", /arts?.*culture|culture/i],
  ["miscellaneous.png", /miscellaneous|general knowledge|general/i],
];

const uploadAsset = async (filename) => {
  const filePath = path.join(assetsDir, filename);
  const body = await fs.readFile(filePath);
  const contentType = filename.endsWith(".png") ? "image/png" : "image/jpeg";
  const key = `series-covers/${filename.replace(/[^a-z0-9.]+/gi, "-").toLowerCase()}`;
  const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key, contentType);
  const response = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body });
  if (!response.ok) throw new Error(`R2 upload failed (${response.status}) for ${filename}`);
  return publicUrl;
};

await mongoose.connect(process.env.MONGO_URI);
let updated = 0;
try {
  const series = await TestSeries.find({}).select("title subject category coverImage").lean();
  for (const [filename, matcher] of assets) {
    const matches = series.filter((item) => matcher.test(`${item.title} ${item.subject} ${item.category}`));
    if (!matches.length) continue;
    const publicUrl = await uploadAsset(filename);
    for (const item of matches) {
      if (item.coverImage) continue;
      await TestSeries.updateOne({ _id: item._id }, { $set: { coverImage: publicUrl } });
      updated += 1;
      console.log(`Mapped ${filename} -> ${item.title}`);
    }
  }
  console.log(`Migration complete. Updated ${updated} test series.`);
} finally {
  await mongoose.disconnect();
}
