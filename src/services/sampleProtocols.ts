import { zipSync, strToU8 } from 'fflate';

export interface SampleArchiveMeta {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  expectedFlaws: string;
  getZipBuffer: () => ArrayBuffer;
}

export const SAMPLE_ARCHIVES: SampleArchiveMeta[] = [
  {
    id: 'ares-nexus',
    name: 'Ares-Nexus-v0.9.zip',
    badge: 'Critical Flaws + Tampered Header',
    badgeColor: 'border-red-500/40 bg-red-950/40 text-red-400',
    description:
      'Interplanetary settlement protocol spec with 22-min Earth-Mars latency race condition, physical custody ambiguity, terrestrial single-point-of-trust, Phobos propellant κ-trap, and a forged CRC32 header.',
    expectedFlaws: 'CRC32 Mismatch, Synchronous Latency Race, Custody Ambiguity, κ-Trap, Solar Conjunction Blackout',
    getZipBuffer: () => {
      // 1. Prepare protocol files
      const zipObj: Record<string, Uint8Array> = {
        '01_settlement_architecture.md': strToU8(`# Ares-Nexus Protocol: Settlement Layer Specification v0.9

## 1. Executive Summary
Ares-Nexus establishes an interplanetary liquidity routing protocol enabling instant cross-chain settlement between Earth-based EVM rollups and Mars Core L1.

## 2. Cross-Planetary Settlement Engine
The settlement mechanism implements a Synchronous Atomic Swap:
- Alice on Earth locks 1,000,000 USDC in the Earth Gateway Contract.
- Bob on Mars locks 450 Martian Grams of Deuterium equivalent in Mars Escrow.
- Both contracts require a mutual secret reveal hash within a 15-minute expiration window (T_swap = 900 seconds).
- Once revealed, funds are released synchronously to both parties.

### 2.1 Latency Assumptions
- Communication travels via the Deep Space Optical Communications (DSOC) relay network.
- The protocol assumes standard packet propagation time without requiring relativistic light-cone epoch adjustments.
- If a swap is not finalized within 15 minutes, funds automatically refund to Alice.
`),
        '02_custody_and_oracles.md': strToU8(`# Ares-Nexus Asset Custody and Physical Depots

## 1. Physical Custody Architecture
- Deep-space volatiles, rare isotopes, and water ice are stored physically at orbital depots (e.g. Phobos Station, Deimos Depot, and Lagrange Point L4).
- Ownership title is represented as ERC-1155 tokens on the settlement ledger.
- When on-chain tokens are burned, the orbital station automated gantry unconditionally releases the physical cargo container to the carrier vessel.

## 2. Oracle Feed
- Commodity valuation is driven by the Terra-Sol Index (TSI) oracle, pushed from Earth validator nodes every 300 seconds.
- Martian liquidation contracts listen directly to the latest TSI price tick.
`),
        '03_governance_and_consensus.md': strToU8(`# Ares-Nexus Governance Model

## 1. Terrestrial Supreme Council
- Protocol upgrades, emergency pauses, and slashing parameters are administered by a 5-of-9 multi-signature council hosted by terrestrial consortium members.
- The terrestrial council retains unilateral emergency circuit-breaker authority to freeze any contract across Earth, Luna, or Mars.
- Voting rounds last 4 hours on terrestrial UTC time.
`),
        '04_threat_model_and_enforcement.md': strToU8(`# Threat Model & Adversarial Enforcement

## 1. Slashed Validator Penalties
- In the event of fraudulent settlement execution, the offending validator's staked collateral (100,000 ARES) is burned on-chain.
- The protocol relies on standard economic slashing; no physical exclusion protocols or navigation beacon isolation mechanisms are defined.
`),
        '05_mining_incentives.json': strToU8(JSON.stringify({
          protocol: "Ares-Nexus",
          miningEconomics: {
            target: "Main Belt Asteroid Volatiles",
            deliveryPoint: "Phobos Refining Station",
            payoutCurrency: "ARES-CREDIT",
            propellantPolicy: "Extractors must deliver raw payload to station reception docks. Station reserves right to price reaction-mass hydrogen propellant on arrival based on station inventory."
          }
        }, null, 2))
      };

      // Generate standard zip
      const zipped = zipSync(zipObj);

      // Mutate raw bytes to forge a forensic CRC32 mismatch in the Central Directory!
      // This creates genuine, real-world forensic evidence!
      const buf = zipped.buffer.slice(0);
      const view = new DataView(buf);
      const bytes = new Uint8Array(buf);

      // Search for Central Directory record for '01_settlement_architecture.md'
      for (let i = 0; i < buf.byteLength - 46; i++) {
        if (
          bytes[i] === 0x50 &&
          bytes[i + 1] === 0x4b &&
          bytes[i + 2] === 0x01 &&
          bytes[i + 3] === 0x02
        ) {
          // Central Directory Header
          const fileNameLen = view.getUint16(i + 28, true);
          const nameBytes = bytes.slice(i + 46, i + 46 + fileNameLen);
          const nameStr = new TextDecoder().decode(nameBytes);

          if (nameStr.includes('01_settlement')) {
            // Tamper with the CRC32 in Central Directory at offset i + 16
            const originalCrc = view.getUint32(i + 16, true);
            view.setUint32(i + 16, originalCrc ^ 0xdeadbeef, true);
            break;
          }
        }
      }

      return buf;
    }
  },
  {
    id: 'deimos-tampered',
    name: 'Deimos-Vault-PoTT-Tampered.zip',
    badge: 'Path Traversal + Ghost Slack Entry',
    badgeColor: 'border-amber-500/40 bg-amber-950/40 text-amber-400',
    description:
      'Archive containing an attempted path traversal exploit (`../keys/station_root.pem`), an unindexed ghost entry injected into slack space, and broken PoTT timestamp chaining.',
    expectedFlaws: 'Path Traversal Injection, Ghost Slack Entry, Broken Proof of Transmission Time',
    getZipBuffer: () => {
      const zipObj: Record<string, Uint8Array> = {
        'spec/pott_verification.md': strToU8(`# Proof of Transmission Time (PoTT) - Broken Implementation

## 1. Transmission Receipts
Station clocks issue local UTC timestamps without relativistic Doppler dilation compensation.
Transactions omit parent light-cone vector hashes.
`),
        'spec/settlement.md': strToU8(`# Deimos Orbital Settlement
Assumes continuous 24/7 radio link across orbital occultations.
`),
        // Deliberate path traversal attack in ZIP archive entry!
        '../../station_security/keys.pem': strToU8(`-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIK3r...[DELIBERATE PATH TRAVERSAL ARTIFACT]...\n-----END EC PRIVATE KEY-----`)
      };

      const zipped = zipSync(zipObj);
      const buf = zipped.buffer.slice(0);
      const view = new DataView(buf);
      const bytes = new Uint8Array(buf);

      // Also tamper local header CRC32 for spec/pott_verification.md
      for (let i = 0; i < buf.byteLength - 30; i++) {
        if (
          bytes[i] === 0x50 &&
          bytes[i + 1] === 0x4b &&
          bytes[i + 2] === 0x03 &&
          bytes[i + 3] === 0x04
        ) {
          const nameLen = view.getUint16(i + 26, true);
          const nameStr = new TextDecoder().decode(bytes.slice(i + 30, i + 30 + nameLen));
          if (nameStr.includes('pott')) {
            const original = view.getUint32(i + 14, true);
            view.setUint32(i + 14, original ^ 0x12345678, true);
            break;
          }
        }
      }

      return buf;
    }
  },
  {
    id: 'astraea-clean',
    name: 'Astraea-Clean-Spec.zip',
    badge: 'Compliant Baseline',
    badgeColor: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-400',
    description:
      'Formally verified interplanetary settlement treaty featuring Asynchronous Relativistic Settlement, Ephemeris-Aware Conjunction Freeze, and Symmetric Delta-V propellant escrows.',
    expectedFlaws: 'No Critical Flaws. Baseline reference implementation.',
    getZipBuffer: () => {
      const zipObj: Record<string, Uint8Array> = {
        '01_relativistic_settlement.md': strToU8(`# Astraea Interplanetary Protocol: Relativistic Settlement Specification

## 1. Relativistic Settlement Layer
- Replaces synchronous atomic swaps with Asynchronous Relativistic Escrow (RAE).
- Employs Proof of Transmission Time (PoTT) with light-cone bounded epoch windows (Earth-Mars 6 to 44 minutes dynamic window).
- State transitions are deterministic and replayable from Merkle receipt roots.

## 2. Solar Conjunction Degraded Mode
- Implements the Ephemeris-Aware Conjunction Freeze Window (EACFW).
- When solar elongation drops below 3.0 degrees, liquidation clocks and settlement deadlines are automatically paused.
`),
        '02_custody_and_propellant.md': strToU8(`# Astraea Asset Custody & Anti-Kappa Trap Architecture

## 1. Symmetric Delta-V Bonded Settlement
- Prevents the κ-trap by requiring downstream refining depots to escrow guaranteed return-propellant allocations prior to mining vessel departure.
- Stations post 150% bonded telemetry stakes verified by cryptographic transponders.
`),
        '03_governance_consensus.md': strToU8(`# Astraea Dual-Planetary Governance

## 1. Threshold Quorum
- Requires independent planetary quorums (minimum 67% terrestrial stake AND 67% Martian validator stake).
- Mandatory 48-hour relativistic challenge window before parameter execution.
`)
      };

      return zipSync(zipObj).buffer.slice(0);
    }
  }
];
