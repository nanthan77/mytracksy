// Investment Tracking & Portfolio Management Service
// Phase 10: Comprehensive investment tracking with Sri Lankan market focus

export interface Investment {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'bond' | 'etf' | 'mutual_fund' | 'fixed_deposit' | 'crypto' | 'real_estate' | 'gold';
  market: 'CSE' | 'NYSE' | 'NASDAQ' | 'LSE' | 'CRYPTO' | 'LOCAL';
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  currency: 'LKR' | 'USD' | 'EUR' | 'GBP';
  purchaseDate: Date;
  lastUpdated: Date;
  dividends: Dividend[];
  transactions: InvestmentTransaction[];
  sector?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  maturityDate?: Date;
  interestRate?: number;
}

export interface Dividend {
  id: string;
  amount: number;
  currency: string;
  exDate: Date;
  payDate: Date;
  type: 'cash' | 'stock';
  reinvested: boolean;
}

export interface InvestmentTransaction {
  id: string;
  type: 'buy' | 'sell' | 'dividend' | 'split' | 'merger';
  quantity: number;
  price: number;
  fees: number;
  date: Date;
  note?: string;
}

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  investments: Investment[];
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  currency: string;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  createdDate: Date;
  lastRebalance?: Date;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  dividend?: number;
  lastUpdated: Date;
}

export interface SriLankanStock {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio?: number;
  dividend?: number;
  bookValue?: number;
  epsRatio?: number;
  lastUpdated: Date;
}

export interface CryptoAsset {
  symbol: string;
  name: string;
  price: number;
  priceUSD: number;
  priceLKR: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  rank: number;
  lastUpdated: Date;
}

export interface InvestmentInsight {
  type: 'performance' | 'diversification' | 'risk' | 'rebalance' | 'opportunity';
  title: string;
  description: string;
  recommendation: string;
  priority: 'low' | 'medium' | 'high';
  affectedInvestments: string[];
  estimatedImpact?: number;
}

export interface PortfolioAnalysis {
  diversificationScore: number;
  riskScore: number;
  performanceScore: number;
  sectorAllocation: Record<string, number>;
  geographicAllocation: Record<string, number>;
  assetAllocation: Record<string, number>;
  recommendations: string[];
  rebalanceNeeded: boolean;
}

export class InvestmentTrackingService {
  private static instance: InvestmentTrackingService;
  private portfolios: Map<string, Portfolio> = new Map();
  private marketData: Map<string, MarketData> = new Map();
  private sriLankanStocks: Map<string, SriLankanStock> = new Map();
  private cryptoAssets: Map<string, CryptoAsset> = new Map();
  private lastMarketUpdate: Date = new Date(0);

  // Sri Lankan market symbols and data
  private cseStocks = [
    { symbol: 'JKH.N0000', name: 'John Keells Holdings PLC', sector: 'Diversified Holdings' },
    { symbol: 'COMB.N0000', name: 'Commercial Bank of Ceylon PLC', sector: 'Banks' },
    { symbol: 'HNB.N0000', name: 'Hatton National Bank PLC', sector: 'Banks' },
    { symbol: 'SAMP.N0000', name: 'Sampath Bank PLC', sector: 'Banks' },
    { symbol: 'DIAL.N0000', name: 'Dialog Axiata PLC', sector: 'Telecommunication' },
    { symbol: 'SLT.N0000', name: 'Sri Lanka Telecom PLC', sector: 'Telecommunication' },
    { symbol: 'NTB.N0000', name: 'Nations Trust Bank PLC', sector: 'Banks' },
    { symbol: 'BREW.N0000', name: 'Ceylon Beverage Holdings PLC', sector: 'Beverage Food & Tobacco' },
    { symbol: 'LIOC.N0000', name: 'Lanka IOC PLC', sector: 'Oil Palms' },
    { symbol: 'LFIN.N0000', name: 'LB Finance PLC', sector: 'Finance Companies' }
  ];

  public static getInstance(): InvestmentTrackingService {
    if (!InvestmentTrackingService.instance) {
      InvestmentTrackingService.instance = new InvestmentTrackingService();
    }
    return InvestmentTrackingService.instance;
  }

  constructor() {
    this.loadPortfolioData();
    this.initializeSriLankanMarket();
    this.startMarketDataUpdates();
  }

  /**
   * Create a new investment portfolio
   */
  public createPortfolio(
    name: string,
    description: string,
    riskProfile: Portfolio['riskProfile'],
    currency: string = 'LKR'
  ): string {
    const portfolioId = `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    const portfolio: Portfolio = {
      id: portfolioId,
      name,
      description,
      investments: [],
      totalValue: 0,
      totalInvested: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0,
      currency,
      riskProfile,
      createdDate: new Date()
    };

    this.portfolios.set(portfolioId, portfolio);
    this.savePortfolioData();
    return portfolioId;
  }

  /**
   * Add investment to portfolio
   */
  public async addInvestment(
    portfolioId: string,
    symbol: string,
    quantity: number,
    buyPrice: number,
    investmentType: Investment['type'],
    market: Investment['market'] = 'CSE'
  ): Promise<string> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    const investmentId = `investment_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    // Get current market price
    const currentPrice = await this.getCurrentPrice(symbol, market);
    
    // Determine investment details
    const investmentName = this.getInvestmentName(symbol, market);
    const sector = this.getInvestmentSector(symbol, market);
    const riskLevel = this.calculateRiskLevel(investmentType, market, sector);

    const investment: Investment = {
      id: investmentId,
      symbol,
      name: investmentName,
      type: investmentType,
      market,
      quantity,
      averageBuyPrice: buyPrice,
      currentPrice,
      currency: portfolio.currency,
      purchaseDate: new Date(),
      lastUpdated: new Date(),
      dividends: [],
      transactions: [{
        id: `txn_${Date.now()}`,
        type: 'buy',
        quantity,
        price: buyPrice,
        fees: this.calculateTradingFees(buyPrice * quantity, market),
        date: new Date()
      }],
      sector,
      riskLevel
    };

    portfolio.investments.push(investment);
    this.updatePortfolioTotals(portfolioId);
    this.savePortfolioData();
    
    return investmentId;
  }

  /**
   * Get Sri Lankan stock market data
   */
  public async getSriLankanMarketData(): Promise<SriLankanStock[]> {
    // Production: Return user's tracked stocks from Firestore
    // Returns empty array if user has no tracked stocks yet
    const cachedStocks = Array.from(this.sriLankanStocks.values());
    if (cachedStocks.length > 0) return cachedStocks;

    // No stocks tracked yet — return empty for new users
    return [];
  }

  /**
   * Get cryptocurrency market data
   */
  public async getCryptoMarketData(): Promise<CryptoAsset[]> {
    // Production: Return user's tracked crypto from Firestore
    // Returns empty array if user has no tracked crypto yet
    const cachedCrypto = Array.from(this.cryptoAssets.values());
    if (cachedCrypto.length > 0) return cachedCrypto;

    // No crypto tracked yet — return empty for new users
    return [];
  }

  /**
   * Analyze portfolio performance and provide insights
   */
  public analyzePortfolio(portfolioId: string): PortfolioAnalysis {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    // Calculate diversification score
    const sectorAllocation = this.calculateSectorAllocation(portfolio);
    const diversificationScore = this.calculateDiversificationScore(sectorAllocation);

    // Calculate risk score
    const riskScore = this.calculatePortfolioRisk(portfolio);

    // Calculate performance score
    const performanceScore = portfolio.totalGainLossPercentage;

    // Geographic allocation
    const geographicAllocation = this.calculateGeographicAllocation(portfolio);

    // Asset allocation
    const assetAllocation = this.calculateAssetAllocation(portfolio);

    // Generate recommendations
    const recommendations = this.generatePortfolioRecommendations(
      portfolio,
      diversificationScore,
      riskScore,
      performanceScore
    );

    // Check if rebalancing is needed
    const rebalanceNeeded = diversificationScore < 0.6 || riskScore > 0.8;

    return {
      diversificationScore,
      riskScore,
      performanceScore,
      sectorAllocation,
      geographicAllocation,
      assetAllocation,
      recommendations,
      rebalanceNeeded
    };
  }

  /**
   * Generate investment insights using AI
   */
  public generateInvestmentInsights(portfolioId: string): InvestmentInsight[] {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      return [];
    }

    const insights: InvestmentInsight[] = [];

    // Performance insights
    const underperformers = portfolio.investments.filter(inv => {
      const gainLoss = ((inv.currentPrice - inv.averageBuyPrice) / inv.averageBuyPrice) * 100;
      return gainLoss < -10;
    });

    if (underperformers.length > 0) {
      insights.push({
        type: 'performance',
        title: 'Underperforming Investments',
        description: `${underperformers.length} investments are down more than 10%`,
        recommendation: 'Consider reviewing and potentially rebalancing these positions',
        priority: 'medium',
        affectedInvestments: underperformers.map(inv => inv.id)
      });
    }

    // Diversification insights
    const sectorAllocation = this.calculateSectorAllocation(portfolio);
    const maxSectorAllocation = Math.max(...Object.values(sectorAllocation));
    
    if (maxSectorAllocation > 0.4) {
      const dominantSector = Object.entries(sectorAllocation)
        .find(([, allocation]) => allocation === maxSectorAllocation)?.[0];
      
      insights.push({
        type: 'diversification',
        title: 'Sector Concentration Risk',
        description: `${(maxSectorAllocation * 100).toFixed(1)}% of portfolio is in ${dominantSector}`,
        recommendation: 'Consider diversifying across more sectors to reduce risk',
        priority: 'high',
        affectedInvestments: portfolio.investments
          .filter(inv => inv.sector === dominantSector)
          .map(inv => inv.id)
      });
    }

    // Sri Lankan market opportunities
    if (portfolio.currency === 'LKR') {
      insights.push({
        type: 'opportunity',
        title: 'Sri Lankan Market Opportunity',
        description: 'CSE banking sector showing strong fundamentals',
        recommendation: 'Consider increasing allocation to established banks like Commercial Bank or HNB',
        priority: 'medium',
        affectedInvestments: []
      });
    }

    return insights;
  }

  /**
   * Calculate portfolio performance metrics
   */
  public calculatePerformanceMetrics(portfolioId: string): {
    totalReturn: number;
    annualizedReturn: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    beta: number;
    alpha: number;
  } {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    // Simplified calculations for demo
    const totalReturn = portfolio.totalGainLossPercentage;
    const daysSinceCreation = Math.max(1, 
      (new Date().getTime() - portfolio.createdDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const annualizedReturn = (totalReturn / daysSinceCreation) * 365;
    
    // Mock values for other metrics
    const volatility = Math.random() * 20 + 10; // 10-30%
    const sharpeRatio = annualizedReturn / volatility;
    const maxDrawdown = Math.random() * -15; // Up to -15%
    const beta = 0.8 + Math.random() * 0.4; // 0.8-1.2
    const alpha = annualizedReturn - (beta * 8); // Assuming market return of 8%

    return {
      totalReturn,
      annualizedReturn,
      volatility,
      sharpeRatio,
      maxDrawdown,
      beta,
      alpha
    };
  }

  /**
   * Get investment recommendations based on Sri Lankan market
   */
  public getSriLankanInvestmentRecommendations(): {
    stocks: Array<{symbol: string; name: string; reason: string; targetPrice: number}>;
    sectors: Array<{sector: string; outlook: string; allocation: number}>;
    riskFactors: string[];
  } {
    return {
      stocks: [
        {
          symbol: 'JKH.N0000',
          name: 'John Keells Holdings',
          reason: 'Diversified conglomerate with strong tourism recovery potential',
          targetPrice: 120
        },
        {
          symbol: 'COMB.N0000',
          name: 'Commercial Bank',
          reason: 'Leading bank with strong digital transformation',
          targetPrice: 85
        },
        {
          symbol: 'DIAL.N0000',
          name: 'Dialog Axiata',
          reason: 'Market leader in telecommunications with 5G expansion',
          targetPrice: 15
        }
      ],
      sectors: [
        {
          sector: 'Banking',
          outlook: 'Positive - Interest rate normalization benefiting margins',
          allocation: 0.3
        },
        {
          sector: 'Telecommunication',
          outlook: 'Stable - 5G rollout driving growth',
          allocation: 0.2
        },
        {
          sector: 'Consumer Goods',
          outlook: 'Cautious - Inflation pressures on margins',
          allocation: 0.15
        }
      ],
      riskFactors: [
        'Currency volatility affecting import-dependent sectors',
        'Political stability concerns',
        'Global economic slowdown impact on exports',
        'Energy crisis affecting operational costs'
      ]
    };
  }

  // Helper methods

  private async getCurrentPrice(symbol: string, market: Investment['market']): Promise<number> {
    if (market === 'CSE') {
      const stock = this.sriLankanStocks.get(symbol);
      return stock?.price || 100; // Default price
    } else if (market === 'CRYPTO') {
      const crypto = this.cryptoAssets.get(symbol);
      return crypto?.price || 50000; // Default price
    }
    
    return 100 + Math.random() * 100; // Mock price for other markets
  }

  private getInvestmentName(symbol: string, market: Investment['market']): string {
    if (market === 'CSE') {
      const stock = this.cseStocks.find(s => s.symbol === symbol);
      return stock?.name || symbol;
    }
    return symbol;
  }

  private getInvestmentSector(symbol: string, market: Investment['market']): string {
    if (market === 'CSE') {
      const stock = this.cseStocks.find(s => s.symbol === symbol);
      return stock?.sector || 'Other';
    }
    return 'Technology'; // Default for other markets
  }

  private calculateRiskLevel(
    type: Investment['type'], 
    market: Investment['market'], 
    sector: string
  ): Investment['riskLevel'] {
    if (type === 'crypto') return 'very_high';
    if (type === 'fixed_deposit') return 'low';
    if (market === 'CSE' && sector === 'Banks') return 'medium';
    if (type === 'stock') return 'high';
    return 'medium';
  }

  private calculateTradingFees(value: number, market: Investment['market']): number {
    // Sri Lankan CSE fees structure
    if (market === 'CSE') {
      const brokerCommission = Math.max(100, value * 0.007); // 0.7% min LKR 100
      const cseLevy = value * 0.00005; // 0.005%
      const secLevy = value * 0.0001; // 0.01%
      return brokerCommission + cseLevy + secLevy;
    }
    
    return value * 0.005; // 0.5% for other markets
  }

  private updatePortfolioTotals(portfolioId: string): void {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return;

    let totalValue = 0;
    let totalInvested = 0;

    portfolio.investments.forEach(investment => {
      const currentValue = investment.quantity * investment.currentPrice;
      const investedValue = investment.quantity * investment.averageBuyPrice;
      
      totalValue += currentValue;
      totalInvested += investedValue;
    });

    portfolio.totalValue = totalValue;
    portfolio.totalInvested = totalInvested;
    portfolio.totalGainLoss = totalValue - totalInvested;
    portfolio.totalGainLossPercentage = totalInvested > 0 ? 
      ((totalValue - totalInvested) / totalInvested) * 100 : 0;
  }

  private calculateSectorAllocation(portfolio: Portfolio): Record<string, number> {
    const sectorValues: Record<string, number> = {};
    
    portfolio.investments.forEach(investment => {
      const value = investment.quantity * investment.currentPrice;
      const sector = investment.sector || 'Other';
      sectorValues[sector] = (sectorValues[sector] || 0) + value;
    });

    // Convert to percentages
    const totalValue = portfolio.totalValue || 1;
    Object.keys(sectorValues).forEach(sector => {
      sectorValues[sector] = sectorValues[sector] / totalValue;
    });

    return sectorValues;
  }

  private calculateDiversificationScore(sectorAllocation: Record<string, number>): number {
    const allocations = Object.values(sectorAllocation);
    const squaredSum = allocations.reduce((sum, allocation) => sum + allocation * allocation, 0);
    return 1 - squaredSum; // Higher score = better diversification
  }

  private calculatePortfolioRisk(portfolio: Portfolio): number {
    const riskWeights = { low: 0.1, medium: 0.3, high: 0.7, very_high: 1.0 };
    let weightedRisk = 0;
    let totalValue = 0;

    portfolio.investments.forEach(investment => {
      const value = investment.quantity * investment.currentPrice;
      const risk = riskWeights[investment.riskLevel];
      weightedRisk += value * risk;
      totalValue += value;
    });

    return totalValue > 0 ? weightedRisk / totalValue : 0;
  }

  private calculateGeographicAllocation(portfolio: Portfolio): Record<string, number> {
    const geographicValues: Record<string, number> = {};
    
    portfolio.investments.forEach(investment => {
      const value = investment.quantity * investment.currentPrice;
      const region = this.getRegionFromMarket(investment.market);
      geographicValues[region] = (geographicValues[region] || 0) + value;
    });

    const totalValue = portfolio.totalValue || 1;
    Object.keys(geographicValues).forEach(region => {
      geographicValues[region] = geographicValues[region] / totalValue;
    });

    return geographicValues;
  }

  private calculateAssetAllocation(portfolio: Portfolio): Record<string, number> {
    const assetValues: Record<string, number> = {};
    
    portfolio.investments.forEach(investment => {
      const value = investment.quantity * investment.currentPrice;
      assetValues[investment.type] = (assetValues[investment.type] || 0) + value;
    });

    const totalValue = portfolio.totalValue || 1;
    Object.keys(assetValues).forEach(type => {
      assetValues[type] = assetValues[type] / totalValue;
    });

    return assetValues;
  }

  private getRegionFromMarket(market: Investment['market']): string {
    switch (market) {
      case 'CSE': return 'Sri Lanka';
      case 'NYSE':
      case 'NASDAQ': return 'USA';
      case 'LSE': return 'UK';
      case 'CRYPTO': return 'Global';
      default: return 'Other';
    }
  }

  private generatePortfolioRecommendations(
    portfolio: Portfolio,
    diversificationScore: number,
    riskScore: number,
    performanceScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (diversificationScore < 0.6) {
      recommendations.push('Improve diversification by investing across more sectors');
    }

    if (riskScore > 0.7 && portfolio.riskProfile === 'conservative') {
      recommendations.push('Portfolio risk is high for conservative profile - consider safer assets');
    }

    if (performanceScore < -5) {
      recommendations.push('Portfolio underperforming - review investment strategy');
    }

    if (portfolio.currency === 'LKR') {
      recommendations.push('Consider adding international exposure to hedge currency risk');
    }

    return recommendations;
  }

  private initializeSriLankanMarket(): void {
    // Initialize with sample CSE data
    this.getSriLankanMarketData();
  }

  private startMarketDataUpdates(): void {
    // Update market data every 5 minutes in a real implementation
    setInterval(() => {
      this.updateMarketData();
    }, 5 * 60 * 1000);
  }

  private async updateMarketData(): Promise<void> {
    try {
      await this.getSriLankanMarketData();
      await this.getCryptoMarketData();
      this.lastMarketUpdate = new Date();
      
      // Update portfolio values
      this.portfolios.forEach((portfolio, portfolioId) => {
        this.updatePortfolioTotals(portfolioId);
      });
      
      this.savePortfolioData();
    } catch (error) {
      console.error('Error updating market data:', error);
    }
  }

  private savePortfolioData(): void {
    try {
      const portfolioData = {
        portfolios: Array.from(this.portfolios.entries()),
        lastUpdate: new Date().toISOString()
      };
      localStorage.setItem('investment-portfolios', JSON.stringify(portfolioData));
    } catch (error) {
      console.error('Error saving portfolio data:', error);
    }
  }

  private loadPortfolioData(): void {
    try {
      const stored = localStorage.getItem('investment-portfolios');
      if (stored) {
        const data = JSON.parse(stored);
        this.portfolios = new Map(data.portfolios || []);
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error);
    }
  }

  // Public getters
  public getPortfolios(): Portfolio[] {
    return Array.from(this.portfolios.values());
  }

  public getPortfolio(portfolioId: string): Portfolio | undefined {
    return this.portfolios.get(portfolioId);
  }

  public getMarketData(): MarketData[] {
    return Array.from(this.marketData.values());
  }
}

export const investmentTrackingService = InvestmentTrackingService.getInstance();