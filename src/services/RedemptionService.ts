/**
 * RedemptionService - F7: Reward Redemption Guide
 * Fetch transfer partners, calculate CPP values, redemption methods
 */

import { supabase } from './supabase/client';

// ============================================================================
// Types
// ============================================================================

export interface TransferPartner {
  id: string;
  programId: string;
  partnerName: string;
  partnerType: 'airline' | 'hotel';
  transferRatio: number; // 1.0 = 1:1
  transferTime: string;
  sweetSpots: string[];
  isActive: boolean;
}

export interface RedemptionMethod {
  type: string; // 'transfer', 'portal', 'statement_credit', 'gift_card'
  centsPerPoint: number;
  minimumRedemption: number | null;
  notes: string | null;
}

export interface ProgramRedemption {
  programName: string;
  programCategory: string;
  directRateCents: number;
  optimalRateCents: number;
  optimalMethod: string;
  redemptionOptions: RedemptionMethod[];
  transferPartners: TransferPartner[];
}

// ============================================================================
// Cache
// ============================================================================

let transferPartnersCache: Record<string, TransferPartner[]> = {};

// ============================================================================
// Transfer Partners
// ============================================================================

export async function getTransferPartners(programId: string): Promise<TransferPartner[]> {
  // Check cache first
  if (transferPartnersCache[programId]) {
    return transferPartnersCache[programId];
  }
  
  try {
    if (!supabase) return [];
    const { data, error } = await (supabase
      .from('transfer_partners') as any)
      .select('*')
      .eq('program_id', programId)
      .eq('is_active', true)
      .order('partner_name');
    
    if (error) throw error;
    
    const partners: TransferPartner[] = ((data || []) as any[]).map((row: any) => ({
      id: row.id,
      programId: row.program_id,
      partnerName: row.partner_name,
      partnerType: row.partner_type,
      transferRatio: parseFloat(row.transfer_ratio),
      transferTime: row.transfer_time || 'Varies',
      sweetSpots: row.sweet_spots || [],
      isActive: row.is_active,
    }));
    
    transferPartnersCache[programId] = partners;
    return partners;
    
  } catch (error) {
    console.error('Failed to fetch transfer partners:', error);
    return [];
  }
}

// ============================================================================
// Redemption Guide
// ============================================================================

export async function getRedemptionGuide(programId: string): Promise<ProgramRedemption> {
  try {
    if (!supabase) throw new Error('Supabase not configured');
    // Fetch program details
    const { data: programData, error: programError } = await (supabase
      .from('reward_programs') as any)
      .select('*')
      .eq('id', programId)
      .single();
    
    if (programError) throw programError;
    
    // Fetch redemption options
    const { data: optionsData, error: optionsError } = await (supabase
      .from('redemption_options') as any)
      .select('*')
      .eq('program_id', programId);
    
    if (optionsError) throw optionsError;
    
    // Fetch transfer partners
    const partners = await getTransferPartners(programId);
    
    const pd = programData as any;
    
    // Parse redemption options
    const redemptionOptions: RedemptionMethod[] = ((optionsData || []) as any[]).map((row: any) => ({
      type: row.redemption_type,
      centsPerPoint: parseFloat(row.cents_per_point),
      minimumRedemption: row.minimum_redemption,
      notes: row.notes,
    }));
    
    // Determine optimal rate and method
    let optimalRate = parseFloat(pd.direct_rate_cents || '1');
    let optimalMethod = 'Direct Redemption';
    
    if (pd.optimal_rate_cents) {
      optimalRate = parseFloat(pd.optimal_rate_cents);
      optimalMethod = pd.optimal_method || 'Transfer Partners';
    } else {
      // Find best from redemption options
      const best = redemptionOptions.reduce((max, option) => 
        option.centsPerPoint > max.centsPerPoint ? option : max,
        redemptionOptions[0] || { centsPerPoint: optimalRate, type: 'portal' }
      );
      
      if (best && best.centsPerPoint > optimalRate) {
        optimalRate = best.centsPerPoint;
        optimalMethod = best.type;
      }
    }
    
    return {
      programName: pd.program_name,
      programCategory: pd.program_category || 'Points',
      directRateCents: parseFloat(pd.direct_rate_cents || '1'),
      optimalRateCents: optimalRate,
      optimalMethod,
      redemptionOptions,
      transferPartners: partners,
    };
    
  } catch (error) {
    console.error('Failed to fetch redemption guide:', error);
    
    // Return empty guide
    return {
      programName: 'Unknown',
      programCategory: 'Points',
      directRateCents: 1,
      optimalRateCents: 1,
      optimalMethod: 'Unknown',
      redemptionOptions: [],
      transferPartners: [],
    };
  }
}

// ============================================================================
// Formatting & Rating
// ============================================================================

export function formatCPP(centsPerPoint: number): string {
  return `${centsPerPoint.toFixed(1)}¢/pt`;
}

export function getRatingForCPP(cpp: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (cpp >= 2.0) return 'excellent';
  if (cpp >= 1.5) return 'good';
  if (cpp >= 1.0) return 'fair';
  return 'poor';
}
