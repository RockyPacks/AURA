import { 
  generateFashionEmbedding, 
  cosineSimilarity, 
  findWardrobeDuplicates, 
  EMBEDDING_DIMENSION 
} from '../src/services/fashionEmbedding.js';
import { WardrobeItem } from '../src/types.js';

console.log('====================================================');
console.log('🧪 AURA FASHION EMBEDDINGS & COSINE SIMILARITY TESTS');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    if (detail) console.log(`   └─ ${detail}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    if (detail) console.error(`   └─ ${detail}`);
    failed++;
  }
}

async function runTests() {
  // Test 1: Dimension and Unit Normalization
  console.log('--- TEST 1: Vector Dimension & L2 Normalization ---');
  const blazer: Partial<WardrobeItem> = {
    name: 'Structured Italian Wool Blazer',
    category: 'Outerwear',
    subcategory: 'Blazer',
    colorPrimary: '#1E293B',
    material: '100% Virgin Wool',
    silhouette: 'Tailored',
    formalityScore: 9,
    seasonality: ['Fall', 'Winter', 'Spring']
  };

  const vec1 = generateFashionEmbedding(blazer);
  assert(vec1.length === EMBEDDING_DIMENSION, `Generates ${EMBEDDING_DIMENSION}-dimensional vector`, `Length: ${vec1.length}`);

  const norm = Math.sqrt(vec1.reduce((sum, v) => sum + v * v, 0));
  assert(Math.abs(norm - 1.0) < 0.01, 'Vector is L2 unit-normalized', `Norm: ${norm.toFixed(4)}`);

  // Test 2: Identical Item Similarity is 100%
  console.log('\n--- TEST 2: Self-Similarity ---');
  const selfSim = cosineSimilarity(vec1, vec1);
  assert(Math.abs(selfSim - 1.0) < 0.001, 'Identical item cosine similarity equals 1.0 (100%)', `Score: ${(selfSim * 100).toFixed(1)}%`);

  // Test 3: Near Duplicate Detection (e.g. Another Navy Wool Blazer)
  console.log('\n--- TEST 3: Near-Duplicate Detection ---');
  const duplicateBlazer: Partial<WardrobeItem> = {
    name: 'Tailored Navy Wool Blazer',
    category: 'Outerwear',
    subcategory: 'Blazer',
    colorPrimary: '#1E293B',
    material: 'Virgin Wool',
    silhouette: 'Tailored',
    formalityScore: 8,
    seasonality: ['Fall', 'Winter', 'Spring']
  };
  const vecDuplicate = generateFashionEmbedding(duplicateBlazer);
  const dupSim = cosineSimilarity(vec1, vecDuplicate);
  assert(dupSim >= 0.88, 'Near duplicate blazer produces >= 88% similarity', `Similarity: ${(dupSim * 100).toFixed(1)}%`);

  // Test 4: Related Item (e.g. Charcoal Wool Blazer)
  console.log('\n--- TEST 4: Stylistically Related Items ---');
  const charcoalBlazer: Partial<WardrobeItem> = {
    name: 'Charcoal Tweed Overcoat',
    category: 'Outerwear',
    subcategory: 'Coat',
    colorPrimary: 'Charcoal',
    material: 'Tweed Wool',
    silhouette: 'Relaxed',
    formalityScore: 7,
    seasonality: ['Fall', 'Winter']
  };
  const vecCharcoal = generateFashionEmbedding(charcoalBlazer);
  const relatedSim = cosineSimilarity(vec1, vecCharcoal);
  assert(relatedSim >= 0.65 && relatedSim < 0.88, 'Stylistically related outerwear produces 65-87% similarity', `Similarity: ${(relatedSim * 100).toFixed(1)}%`);

  // Test 5: Completely Distinct Items (e.g. White Sneakers vs Navy Blazer)
  console.log('\n--- TEST 5: Unrelated Category & Item Discrimination ---');
  const sneakers: Partial<WardrobeItem> = {
    name: 'Minimalist White Leather Low-Top Sneakers',
    category: 'Shoes',
    subcategory: 'Sneakers',
    colorPrimary: '#FFFFFF',
    material: 'Calfskin Leather',
    formalityScore: 3,
    seasonality: ['Spring', 'Summer', 'Fall']
  };
  const vecSneakers = generateFashionEmbedding(sneakers);
  const distinctSim = cosineSimilarity(vec1, vecSneakers);
  assert(distinctSim < 0.40, 'Completely different category (Shoes vs Outerwear) produces < 40% similarity', `Similarity: ${(distinctSim * 100).toFixed(1)}%`);

  // Test 6: findWardrobeDuplicates ranking
  console.log('\n--- TEST 6: Wardrobe Duplicate Finder ---');
  const mockWardrobe: WardrobeItem[] = [
    { ...blazer, id: 'blazer-1', timesWorn: 5, dateAdded: '2026-01-01' } as WardrobeItem,
    { ...charcoalBlazer, id: 'coat-1', timesWorn: 2, dateAdded: '2026-01-01' } as WardrobeItem,
    { ...sneakers, id: 'shoes-1', timesWorn: 10, dateAdded: '2026-01-01' } as WardrobeItem
  ];

  const matches = findWardrobeDuplicates(vecDuplicate, mockWardrobe, 0.70);
  assert(matches.length >= 1, 'Finds high-risk duplicate in wardrobe', `Found ${matches.length} matches`);
  assert(matches[0].item.id === 'blazer-1', 'Correctly ranks highest similarity piece first', `Top match: ${matches[0].item.name} (${matches[0].similarityPercentage}%)`);

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
