#!/usr/bin/env node

const path = require('path');
const PinterestApi = require('../src/api');
const { downloadBatch } = require('../src/downloader');
const { buildContactSheet } = require('../src/contact-sheet');
const { buildHtmlGallery } = require('../src/gallery');

const args = process.argv.slice(2);

function showHelp() {
  console.log(`
Pinref 📌 - Pinterest Reference Moodboard & Single-Glance Vision CLI

USAGE:
  pinref search <query> [options]       Search & build a reference sheet
  pinref similar <pinId> [options]      Find more references similar to a Pin
  pinref pin <pinId>                    Inspect single pin metadata
  pinref "<query>"                      Quick shortcut for search

OPTIONS:
  -c, --count <number>    Number of images to fetch (default: 12)
  -o, --out <directory>   Output directory (default: ./references/<query-slug>)
  -h, --help              Show this help message
  -v, --version           Show version

EXAMPLES:
  pinref search "cyberpunk character design" --count 12
  pinref similar "1057008975051301499"
  pinref "minimalist architecture moodboard"
  pinref pin "893049801158256972"
`);
}

function parseOptions(rawArgs) {
  const options = {
    count: 12,
    out: null
  };
  const filtered = [];

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg === '-c' || arg === '--count') {
      options.count = parseInt(rawArgs[++i], 10) || 12;
    } else if (arg === '-o' || arg === '--out') {
      options.out = rawArgs[++i];
    } else if (arg === '-h' || arg === '--help') {
      showHelp();
      process.exit(0);
    } else if (arg === '-v' || arg === '--version') {
      console.log('Pinref v1.0.0');
      process.exit(0);
    } else {
      filtered.push(arg);
    }
  }

  return { options, remaining: filtered };
}

async function run() {
  if (args.length === 0 || args[0] === '-h' || args[0] === '--help') {
    showHelp();
    process.exit(0);
  }

  const { options, remaining } = parseOptions(args);
  let command = remaining[0];
  let param = remaining.slice(1).join(' ');

  if (command !== 'search' && command !== 'similar' && command !== 'pin') {
    param = remaining.join(' ');
    command = 'search';
  }

  if (command === 'pin') {
    if (!param) {
      console.error('❌ Error: Pin ID required. Usage: pinref pin <pinId>');
      process.exit(1);
    }
    console.log(`\n📌 Inspecting Pin: ${param}...`);
    const pin = PinterestApi.getPin(param);
    console.log(`\nTitle:       ${pin.title}`);
    console.log(`Description: ${pin.description || 'N/A'}`);
    console.log(`Repins:      ${pin.repins || '0'}`);
    console.log(`Image:       ${pin.image}\n`);
    return;
  }

  let searchQuery = param;

  if (command === 'similar') {
    if (!param) {
      console.error('❌ Error: Pin ID required. Usage: pinref similar <pinId>');
      process.exit(1);
    }
    console.log(`\n🔍 Looking up Pin details for ID: ${param}...`);
    const pin = PinterestApi.getPin(param);
    console.log(`📌 Found Pin: "${pin.title}"`);
    const cleaned = (pin.title || '')
      .split('|')[0]
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .trim();
    searchQuery = cleaned || 'reference';
    console.log(`🎯 Searching variations for: "${searchQuery}"\n`);
  }

  if (!searchQuery) {
    console.error('❌ Error: Search query required.');
    showHelp();
    process.exit(1);
  }

  const slug = searchQuery
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40)
    .replace(/^-|-$/g, '') || 'pinterest-reference';

  const outputDir = options.out ? path.resolve(options.out) : path.resolve(process.cwd(), 'references', slug);

  console.log(`\n📡 Fetching reference images from Pinterest API for: "${searchQuery}"...`);
  const searchResult = PinterestApi.searchPins(searchQuery);

  const candidates = searchResult.data.slice(0, options.count);
  if (candidates.length === 0) {
    console.error('❌ No images found for this query.');
    process.exit(1);
  }

  console.log(`⚡ Retrieved ${candidates.length} reference candidates in ${searchResult.ms}ms (Tier ${searchResult.tier} - Plain HTTP).`);
  console.log(`💾 Downloading images into: ${outputDir}...`);

  const { downloaded } = await downloadBatch(candidates, outputDir);
  console.log(`✅ Downloaded ${downloaded.length} images.`);

  console.log(`🎨 Building composite contact sheet image...`);
  const contactSheetPath = path.join(outputDir, 'contact_sheet.jpg');
  await buildContactSheet(downloaded, searchQuery, contactSheetPath);

  console.log(`🌐 Building interactive HTML gallery...`);
  const galleryPath = path.join(outputDir, 'gallery.html');
  buildHtmlGallery(downloaded, searchQuery, galleryPath);

  console.log(`\n======================================================`);
  console.log(`✨ PINREF BATCH COMPLETE!`);
  console.log(`📁 Download Folder: file://${outputDir}`);
  console.log(`🖼️  Contact Sheet:  file://${contactSheetPath}`);
  console.log(`🌐 HTML Gallery:   file://${galleryPath}`);
  console.log(`======================================================\n`);
  console.log(`💡 Next steps:`);
  console.log(`1. View the single contact sheet: file://${contactSheetPath}`);
  console.log(`2. To find variations of any pin: pinref similar "<pinId>"\n`);
}

run().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
