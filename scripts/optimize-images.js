import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.join(__dirname, '..', 'static', 'assets');

async function optimizeImage(inputPath, outputPath, options = {}) {
	const {
		maxWidth = 1920,
		quality = 75,
		format = 'webp'
	} = options;

	try {
		const stats = fs.statSync(inputPath);
		const sizeBefore = (stats.size / 1024 / 1024).toFixed(2);

		console.log(`Optimizing ${path.basename(inputPath)}...`);
		console.log(`  Size before: ${sizeBefore} MB`);

		await sharp(inputPath)
			.resize(maxWidth, null, {
				fit: 'inside',
				withoutEnlargement: true
			})
			.webp({ quality })
			.toFile(outputPath);

		const statsAfter = fs.statSync(outputPath);
		const sizeAfter = (statsAfter.size / 1024 / 1024).toFixed(2);
		const reduction = ((1 - statsAfter.size / stats.size) * 100).toFixed(1);

		console.log(`  Size after: ${sizeAfter} MB`);
		console.log(`  Reduction: ${reduction}%`);
		console.log(`  ✅ Saved to: ${path.basename(outputPath)}\n`);

		return true;
	} catch (error) {
		console.error(`  ❌ Error: ${error.message}\n`);
		return false;
	}
}

async function convertJpgToWebP(inputPath, outputPath, quality = 85) {
	try {
		const stats = fs.statSync(inputPath);
		const sizeBefore = (stats.size / 1024).toFixed(2);

		console.log(`Converting ${path.basename(inputPath)} to WebP...`);
		console.log(`  Size before: ${sizeBefore} KB`);

		await sharp(inputPath)
			.webp({ quality })
			.toFile(outputPath);

		const statsAfter = fs.statSync(outputPath);
		const sizeAfter = (statsAfter.size / 1024).toFixed(2);
		const reduction = ((1 - statsAfter.size / stats.size) * 100).toFixed(1);

		console.log(`  Size after: ${sizeAfter} KB`);
		console.log(`  Reduction: ${reduction}%`);
		console.log(`  ✅ Saved to: ${path.basename(outputPath)}\n`);

		return true;
	} catch (error) {
		console.error(`  ❌ Error: ${error.message}\n`);
		return false;
	}
}

async function main() {
	console.log('='.repeat(60));
	console.log('IMAGE OPTIMIZATION SCRIPT');
	console.log('='.repeat(60));
	console.log('');

	// 1. Optimize the-dark.webp (25MB -> <500KB)
	const theDarkInput = path.join(assetsDir, 'the-dark.webp');
	const theDarkOutput = path.join(assetsDir, 'the-dark-optimized.webp');

	if (fs.existsSync(theDarkInput)) {
		await optimizeImage(theDarkInput, theDarkOutput, {
			maxWidth: 1920,
			quality: 70 // Lower quality for larger size reduction
		});
	} else {
		console.log('⚠️  the-dark.webp not found, skipping...\n');
	}

	// 2. Convert dc-logo.jpg to WebP
	const logoInput = path.join(assetsDir, 'dc-logo.jpg');
	const logoOutput = path.join(assetsDir, 'dc-logo.webp');

	if (fs.existsSync(logoInput)) {
		await convertJpgToWebP(logoInput, logoOutput, 85);
	} else {
		console.log('⚠️  dc-logo.jpg not found, skipping...\n');
	}

	console.log('='.repeat(60));
	console.log('OPTIMIZATION COMPLETE');
	console.log('='.repeat(60));
	console.log('');
	console.log('Next steps:');
	console.log('1. Update code to use optimized images');
	console.log('2. Test images display correctly');
	console.log('3. Remove old unoptimized files after testing');
	console.log('');
}

main().catch(console.error);
