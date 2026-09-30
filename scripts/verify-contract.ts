/**
 * verify-contract.ts — Verify deployed contract is live on Midnight Preprod
 *
 * Queries the Midnight Preprod indexer to confirm that the contract address
 * written to .contract-address is actually deployed and visible on-chain.
 *
 * Usage:
 *   npm run verify-contract
 *   npx tsx scripts/verify-contract.ts
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';

const INDEXER_URI = 'https://indexer.preprod.midnight.network/api/v4/graphql';

const QUERY = `
  query VerifyContract($address: String!) {
    contract(address: $address) {
      address
      deployedAt
      state {
        totalPaidIn
        totalSplitOut
        claimCount
      }
    }
  }
`;

async function verifyContract() {
  try {
    // Read contract address from .contract-address file
    const addressPath = resolve(process.cwd(), '.contract-address');
    const contractAddress = (await readFile(addressPath, 'utf-8')).trim();

    console.log('🔍 Verifying contract on Midnight Preprod indexer...');
    console.log(`📝 Contract Address: ${contractAddress}`);
    console.log(`🌐 Indexer: ${INDEXER_URI}\n`);

    // Query indexer
    const response = await fetch(INDEXER_URI, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { address: contractAddress },
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`Indexer returned HTTP ${response.status}`);
    }

    const json: any = await response.json();

    if (json.errors?.length) {
      console.error('❌ GraphQL errors:', json.errors.map((e: any) => e.message).join('; '));
      process.exit(1);
    }

    const contract = json.data?.contract;

    if (!contract) {
      console.error('❌ Contract not found on Preprod indexer.');
      console.error('   The address may be incorrect or the deployment has not propagated yet.');
      process.exit(1);
    }

    console.log('✅ Contract verified on-chain!\n');
    console.log(`   Address:       ${contract.address}`);
    console.log(`   Deployed At:   ${contract.deployedAt ?? 'N/A'}`);
    console.log(`   Total Paid In: ${contract.state?.totalPaidIn ?? 0} tDUST`);
    console.log(`   Total Split:   ${contract.state?.totalSplitOut ?? 0} tDUST`);
    console.log(`   Claims:        ${contract.state?.claimCount ?? 0}`);
    console.log('\n🎉 Verification successful — contract is live on Midnight Preprod!');
  } catch (err: any) {
    console.error('❌ Verification failed:');
    console.error(`   ${err?.message ?? err}`);
    process.exit(1);
  }
}

verifyContract();
