import { culturalIntegrationService } from './culturalIntegrationService';
import { merchantRecognitionService } from './merchantRecognitionService';

export interface VoiceCommand {
  id: string;
  type: 'simple' | 'multi-step' | 'complex' | 'cultural';
  intent: string;
  confidence: number;
  parameters: Record<string, any>;
  culturalContext?: any;
  nextStep?: string;
  requiresConfirmation?: boolean;
}

export interface MultiStepTransaction {
  id: string;
  steps: VoiceCommand[];
  currentStep: number;
  context: Record<string, any>;
  isComplete: boolean;
  finalExpense?: any;
}

export interface VoiceWorkflow {
  name: string;
  description: string;
  steps: string[];
  triggers: string[];
  culturalRelevance?: string[];
}

export class AdvancedVoiceService {
  private static instance: AdvancedVoiceService;
  private activeTransactions: Map<string, MultiStepTransaction> = new Map();
  
  // Advanced voice command patterns
  private voicePatterns = {
    // Simple expense commands
    simple: [
      /(?:add|record|spent|paid)\s+(?:rs\.?|rupees?|lkr)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rs\.?|rupees?|lkr)?\s+(?:for|on|at)\s+(.+)/i,
      /(?:i\s+)?(?:spent|paid|bought)\s+(.+?)\s+(?:for|at)\s+(?:rs\.?|rupees?|lkr)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rs\.?|rupees?|lkr)\s+(?:for|on)\s+(.+)/i
    ],
    
    // Multi-step transaction patterns
    multiStep: [
      /(?:start|begin|create)\s+(?:a\s+)?(?:new\s+)?(?:expense|transaction|record)/i,
      /(?:i\s+want\s+to\s+)?(?:add|record|track)\s+(?:multiple|several|some)\s+expenses/i,
      /(?:shopping|bought|purchased)\s+(?:multiple|several|many)\s+(?:items|things)/i
    ],
    
    // Complex workflows
    complex: [
      /(?:plan|budget|prepare)\s+(?:for|my)\s+(.+?)\s+(?:celebration|festival|event)/i,
      /(?:what|how much)\s+(?:should|will|do)\s+(?:i|we)\s+(?:spend|budget|need)\s+(?:for|on)\s+(.+)/i,
      /(?:create|make|set)\s+(?:a\s+)?(?:budget|plan)\s+(?:for|to)\s+(.+)/i
    ],
    
    // Cultural context patterns
    cultural: [
      /(?:vesak|avurudu|poya|eid|christmas|tamil new year|sinhala new year)\s+(.+)/i,
      /(?:temple|church|mosque|kovil)\s+(?:donation|offering|dana)\s+(.+)/i,
      /(?:traditional|cultural|religious|festival)\s+(.+)/i
    ],
    
    // Query patterns
    queries: [
      /(?:what|how much)\s+(?:did|have)\s+(?:i|we)\s+(?:spend|spent)\s+(?:on|for|at)\s+(.+)/i,
      /(?:show|tell|list)\s+(?:me\s+)?(?:my|our)\s+(?:expenses|spending)\s+(?:for|from|in|on)\s+(.+)/i,
      /(?:balance|total|summary|report)/i
    ],
    
    // Control patterns
    control: [
      /(?:cancel|stop|abort|exit|quit)/i,
      /(?:help|assist|guide|support)/i,
      /(?:repeat|again|say that again)/i,
      /(?:confirm|yes|okay|proceed|continue)/i,
      /(?:no|reject|decline|cancel that)/i
    ]
  };

  // Predefined workflows
  private workflows: VoiceWorkflow[] = [
    {
      name: 'Festival Expense Planning',
      description: 'Plan and budget for upcoming festivals',
      steps: [
        'Select festival or event',
        'Choose expense categories',
        'Set budget amounts',
        'Confirm planning'
      ],
      triggers: ['plan festival', 'budget for', 'prepare for celebration'],
      culturalRelevance: ['vesak', 'avurudu', 'poya', 'eid', 'christmas']
    },
    {
      name: 'Shopping Trip Recording',
      description: 'Record multiple purchases from a shopping trip',
      steps: [
        'Start shopping session',
        'Add individual items',
        'Specify merchants/locations',
        'Finalize shopping expenses'
      ],
      triggers: ['shopping trip', 'multiple purchases', 'bought many items']
    },
    {
      name: 'Monthly Budget Review',
      description: 'Review and analyze monthly spending patterns',
      steps: [
        'Review total spending',
        'Check category breakdown',
        'Compare with budget',
        'Set next month goals'
      ],
      triggers: ['monthly review', 'spending summary', 'budget analysis']
    },
    {
      name: 'Religious Offering Record',
      description: 'Record religious donations and offerings',
      steps: [
        'Specify religious place',
        'Enter offering amount',
        'Choose offering type',
        'Add spiritual notes'
      ],
      triggers: ['temple donation', 'church offering', 'mosque zakat', 'dana'],
      culturalRelevance: ['poya', 'religious', 'temple', 'church', 'mosque']
    }
  ];

  public static getInstance(): AdvancedVoiceService {
    if (!AdvancedVoiceService.instance) {
      AdvancedVoiceService.instance = new AdvancedVoiceService();
    }
    return AdvancedVoiceService.instance;
  }

  /**
   * Main voice command processing with cultural awareness
   */
  public async processAdvancedVoiceCommand(voiceText: string, language: 'en' | 'si' | 'ta' = 'en'): Promise<{
    commands: VoiceCommand[];
    responses: string[];
    requiresInteraction?: boolean;
    multiStepTransaction?: MultiStepTransaction;
  }> {
    // Set cultural context
    culturalIntegrationService.setLanguage(language);
    
    // Enhance voice command with cultural context
    const culturalEnhancement = culturalIntegrationService.enhanceVoiceCommandWithCulture(voiceText);
    
    // Parse the command
    const commands = await this.parseVoiceCommand(culturalEnhancement.culturallyEnhancedText);
    
    // Process each command
    const responses: string[] = [];
    let multiStepTransaction: MultiStepTransaction | undefined;
    let requiresInteraction = false;

    for (const command of commands) {
      // Add cultural context to command
      command.culturalContext = {
        detectedFestival: culturalEnhancement.detectedFestival,
        suggestedAmount: culturalEnhancement.suggestedAmount,
        culturalNotes: culturalEnhancement.culturalNotes,
        addedContext: culturalEnhancement.addedContext
      };

      const result = await this.processCommand(command);
      responses.push(result.response);
      
      if (result.multiStepTransaction) {
        multiStepTransaction = result.multiStepTransaction;
        requiresInteraction = true;
      }
      
      if (result.requiresInteraction) {
        requiresInteraction = true;
      }
    }

    return {
      commands,
      responses,
      requiresInteraction,
      multiStepTransaction
    };
  }

  /**
   * Continue a multi-step transaction
   */
  public async continueMultiStepTransaction(
    transactionId: string, 
    voiceInput: string
  ): Promise<{
    transaction: MultiStepTransaction;
    response: string;
    isComplete: boolean;
    nextPrompt?: string;
  }> {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Process the current step
    const currentStep = transaction.steps[transaction.currentStep];
    const stepResult = await this.processTransactionStep(transaction, voiceInput);
    
    // Update transaction context
    Object.assign(transaction.context, stepResult.context);
    
    // Move to next step or complete
    if (stepResult.moveToNext && transaction.currentStep < transaction.steps.length - 1) {
      transaction.currentStep++;
    } else if (stepResult.isComplete) {
      transaction.isComplete = true;
      transaction.finalExpense = await this.finalizeTransaction(transaction);
      this.activeTransactions.delete(transactionId);
    }

    const nextPrompt = transaction.isComplete 
      ? undefined 
      : this.getNextStepPrompt(transaction);

    return {
      transaction,
      response: stepResult.response,
      isComplete: transaction.isComplete,
      nextPrompt
    };
  }

  /**
   * Get available workflows based on context
   */
  public getAvailableWorkflows(culturalContext?: any): VoiceWorkflow[] {
    let workflows = [...this.workflows];
    
    if (culturalContext?.currentEvent) {
      // Filter workflows based on current cultural event
      workflows = workflows.filter(workflow => 
        !workflow.culturalRelevance || 
        workflow.culturalRelevance.some(relevance => 
          culturalContext.currentEvent.name.toLowerCase().includes(relevance)
        )
      );
    }
    
    return workflows;
  }

  /**
   * Start a specific workflow
   */
  public startWorkflow(workflowName: string, initialContext?: any): MultiStepTransaction {
    const workflow = this.workflows.find(w => w.name === workflowName);
    if (!workflow) {
      throw new Error(`Workflow '${workflowName}' not found`);
    }

    const transactionId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const transaction: MultiStepTransaction = {
      id: transactionId,
      steps: workflow.steps.map((step, index) => ({
        id: `step_${index}`,
        type: 'multi-step',
        intent: step,
        confidence: 1.0,
        parameters: {}
      })),
      currentStep: 0,
      context: initialContext || {},
      isComplete: false
    };

    this.activeTransactions.set(transactionId, transaction);
    return transaction;
  }

  // Private helper methods

  private async parseVoiceCommand(voiceText: string): Promise<VoiceCommand[]> {
    const commands: VoiceCommand[] = [];
    const lowerText = voiceText.toLowerCase();

    // Check for control commands first
    for (const pattern of this.voicePatterns.control) {
      const match = lowerText.match(pattern);
      if (match) {
        commands.push({
          id: this.generateCommandId(),
          type: 'simple',
          intent: 'control',
          confidence: 0.95,
          parameters: { action: match[0].trim() }
        });
        return commands;
      }
    }

    // Check for cultural patterns
    for (const pattern of this.voicePatterns.cultural) {
      const match = lowerText.match(pattern);
      if (match) {
        commands.push({
          id: this.generateCommandId(),
          type: 'cultural',
          intent: 'cultural_expense',
          confidence: 0.9,
          parameters: { 
            context: match[0].trim(),
            details: match[1]?.trim() 
          }
        });
      }
    }

    // Check for complex workflow patterns
    for (const pattern of this.voicePatterns.complex) {
      const match = lowerText.match(pattern);
      if (match) {
        commands.push({
          id: this.generateCommandId(),
          type: 'complex',
          intent: 'start_workflow',
          confidence: 0.85,
          parameters: { 
            workflow: 'Festival Expense Planning',
            target: match[1]?.trim() 
          }
        });
      }
    }

    // Check for multi-step patterns
    for (const pattern of this.voicePatterns.multiStep) {
      const match = lowerText.match(pattern);
      if (match) {
        commands.push({
          id: this.generateCommandId(),
          type: 'multi-step',
          intent: 'start_multi_expense',
          confidence: 0.8,
          parameters: { trigger: match[0].trim() }
        });
      }
    }

    // Check for simple expense patterns
    for (const pattern of this.voicePatterns.simple) {
      const match = lowerText.match(pattern);
      if (match) {
        const amount = this.parseAmount(match[1] || match[2]);
        const description = match[2] || match[1];
        
        if (amount && description) {
          commands.push({
            id: this.generateCommandId(),
            type: 'simple',
            intent: 'add_expense',
            confidence: 0.9,
            parameters: { 
              amount, 
              description: description.trim() 
            }
          });
        }
      }
    }

    // Check for query patterns
    for (const pattern of this.voicePatterns.queries) {
      const match = lowerText.match(pattern);
      if (match) {
        commands.push({
          id: this.generateCommandId(),
          type: 'simple',
          intent: 'query',
          confidence: 0.85,
          parameters: { 
            query: match[0].trim(),
            target: match[1]?.trim() 
          }
        });
      }
    }

    // If no patterns match, create a generic command
    if (commands.length === 0) {
      commands.push({
        id: this.generateCommandId(),
        type: 'simple',
        intent: 'unknown',
        confidence: 0.3,
        parameters: { text: voiceText }
      });
    }

    return commands;
  }

  private async processCommand(command: VoiceCommand): Promise<{
    response: string;
    multiStepTransaction?: MultiStepTransaction;
    requiresInteraction?: boolean;
  }> {
    switch (command.intent) {
      case 'add_expense':
        return this.processSimpleExpense(command);
      
      case 'cultural_expense':
        return this.processCulturalExpense(command);
      
      case 'start_workflow':
        return this.processWorkflowStart(command);
      
      case 'start_multi_expense':
        return this.processMultiExpenseStart(command);
      
      case 'query':
        return this.processQuery(command);
      
      case 'control':
        return this.processControl(command);
      
      default:
        return {
          response: 'I didn\'t understand that command. Please try again or say "help" for assistance.'
        };
    }
  }

  private async processSimpleExpense(command: VoiceCommand): Promise<{
    response: string;
    multiStepTransaction?: MultiStepTransaction;
  }> {
    const { amount, description } = command.parameters;
    
    // Enhance with merchant recognition
    const merchantRecognition = merchantRecognitionService.recognizeMerchant(description, amount);
    
    // Enhance with cultural context
    const culturalEnhancement = culturalIntegrationService.enhanceExpenseWithCulturalContext(
      amount, 
      description, 
      merchantRecognition.category
    );

    // Generate cultural response
    const response = culturalIntegrationService.generateCulturalVoiceResponse(
      amount,
      culturalEnhancement.suggestedCategory || merchantRecognition.category,
      merchantRecognition.merchantName
    );

    // Create expense object
    const expense = {
      amount,
      description,
      merchant: merchantRecognition.merchantName,
      category: culturalEnhancement.suggestedCategory || merchantRecognition.category,
      subCategory: culturalEnhancement.suggestedCategory ? culturalEnhancement.originalCategory : undefined,
      date: new Date(),
      source: 'voice',
      confidence: Math.min(command.confidence, merchantRecognition.confidence),
      culturalContext: command.culturalContext
    };

    return { response, multiStepTransaction: undefined };
  }

  private async processCulturalExpense(command: VoiceCommand): Promise<{
    response: string;
    requiresInteraction?: boolean;
  }> {
    const context = culturalIntegrationService.getCurrentCulturalContext();
    const suggestions = culturalIntegrationService.getCulturalExpenseSuggestions();
    
    let response = `I detected cultural context: ${command.parameters.context}. `;
    
    if (suggestions.length > 0) {
      response += `Here are some typical expenses: ${suggestions.slice(0, 3).map(s => 
        `${s.category} (around ${s.typicalAmount} LKR)`
      ).join(', ')}. Please specify the amount and category.`;
      
      return { response, requiresInteraction: true };
    }
    
    response += 'Please specify the amount and what you spent on.';
    return { response, requiresInteraction: true };
  }

  private async processWorkflowStart(command: VoiceCommand): Promise<{
    response: string;
    multiStepTransaction?: MultiStepTransaction;
  }> {
    const workflowName = command.parameters.workflow;
    const transaction = this.startWorkflow(workflowName, command.parameters);
    
    const response = `Starting ${workflowName}. ${this.getNextStepPrompt(transaction)}`;
    
    return { response, multiStepTransaction: transaction };
  }

  private async processMultiExpenseStart(command: VoiceCommand): Promise<{
    response: string;
    multiStepTransaction?: MultiStepTransaction;
  }> {
    const transaction = this.startWorkflow('Shopping Trip Recording');
    
    const response = 'Starting multi-expense recording. Please tell me about your first purchase.';
    
    return { response, multiStepTransaction: transaction };
  }

  private async processQuery(command: VoiceCommand): Promise<{
    response: string;
  }> {
    // This would integrate with expense service to get actual data
    const response = `Here's your spending information: [Query: ${command.parameters.query}]`;
    return { response };
  }

  private async processControl(command: VoiceCommand): Promise<{
    response: string;
  }> {
    const action = command.parameters.action;
    
    if (action.includes('help')) {
      return { 
        response: 'I can help you: Add expenses, plan for festivals, track spending, and manage budgets. Try saying "Add 500 rupees for lunch" or "Plan for Vesak expenses".' 
      };
    }
    
    if (action.includes('cancel') || action.includes('stop')) {
      return { response: 'Operation cancelled.' };
    }
    
    return { response: 'Understood.' };
  }

  private async processTransactionStep(
    transaction: MultiStepTransaction, 
    input: string
  ): Promise<{
    context: Record<string, any>;
    response: string;
    moveToNext: boolean;
    isComplete: boolean;
  }> {
    const currentStep = transaction.steps[transaction.currentStep];
    const stepContext: Record<string, any> = {};
    let response = '';
    let moveToNext = false;
    let isComplete = false;

    // Process based on current step intent
    switch (currentStep.intent) {
      case 'Select festival or event':
        stepContext.selectedEvent = input;
        response = `Selected ${input}. Now choose expense categories.`;
        moveToNext = true;
        break;
        
      case 'Add individual items':
        if (!transaction.context.items) transaction.context.items = [];
        const expense = this.parseExpenseFromInput(input);
        transaction.context.items.push(expense);
        response = `Added ${expense.description} for ${expense.amount} LKR. Add another item or say "done".`;
        // Don't move to next, stay in this step until user says done
        break;
        
      default:
        response = `Processing: ${input}`;
        moveToNext = true;
    }

    // Check if this is the last step
    if (moveToNext && transaction.currentStep >= transaction.steps.length - 1) {
      isComplete = true;
    }

    return { context: stepContext, response, moveToNext, isComplete };
  }

  private parseExpenseFromInput(input: string): any {
    // Simple parsing for demo - would use the same parsing logic as main commands
    const match = input.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rs\.?|rupees?|lkr)?\s+(?:for|on)\s+(.+)/i);
    
    if (match) {
      return {
        amount: this.parseAmount(match[1]),
        description: match[2].trim(),
        date: new Date()
      };
    }
    
    return {
      amount: 0,
      description: input,
      date: new Date()
    };
  }

  private async finalizeTransaction(transaction: MultiStepTransaction): Promise<any> {
    // Combine all transaction data into final expense(s)
    return {
      type: 'multi-step-expense',
      items: transaction.context.items || [],
      totalAmount: (transaction.context.items || []).reduce((sum: number, item: any) => sum + item.amount, 0),
      context: transaction.context
    };
  }

  private getNextStepPrompt(transaction: MultiStepTransaction): string {
    if (transaction.currentStep >= transaction.steps.length) {
      return 'Transaction complete!';
    }
    
    const step = transaction.steps[transaction.currentStep];
    const prompts: Record<string, string> = {
      'Select festival or event': 'Which festival or event are you planning for?',
      'Choose expense categories': 'What types of expenses do you want to budget for?',
      'Add individual items': 'Tell me about your purchase (e.g., "50 rupees for coffee")',
      'Specify religious place': 'Which temple, church, or mosque?'
    };
    
    return prompts[step.intent] || `Please provide information for: ${step.intent}`;
  }

  private parseAmount(amountStr: string): number {
    const cleaned = amountStr.replace(/,/g, '').trim();
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? 0 : amount;
  }

  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const advancedVoiceService = AdvancedVoiceService.getInstance();