import { supabase } from '@/integrations/supabase/client';

interface LogEntry {
  session_id: string;
  log_level: 'info' | 'warn' | 'error' | 'debug';
  log_type: 'click' | 'navigation' | 'api_call' | 'error' | 'performance' | 'form_submit';
  component?: string;
  action: string;
  target?: string;
  success: boolean;
  error_message?: string;
  metadata?: any;
  user_agent: string;
  page_url: string;
  referrer?: string;
}

interface ApiCallLog {
  session_id: string;
  endpoint: string;
  method: string;
  status_code?: number;
  duration_ms: number;
  success: boolean;
  request_payload?: any;
  response_payload?: any;
  error_message?: string;
}

interface ErrorLog {
  session_id: string;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  component?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  browser_info: any;
  page_url: string;
}

interface InteractionLog {
  session_id: string;
  event_type: 'click' | 'hover' | 'scroll' | 'input' | 'focus' | 'blur';
  element_id?: string;
  element_class?: string;
  element_text?: string;
  page_path: string;
  x_coordinate?: number;
  y_coordinate?: number;
  viewport_width: number;
  viewport_height: number;
}

class LoggingService {
  private sessionId: string;
  private logQueue: LogEntry[] = [];
  private apiLogQueue: ApiCallLog[] = [];
  private interactionQueue: InteractionLog[] = [];
  private batchSize = 10;
  private batchInterval = 5000; // 5 seconds
  private batchTimer?: NodeJS.Timeout;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.startBatchTimer();
    this.setupBeforeUnload();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('logging_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('logging_session_id', sessionId);
    }
    return sessionId;
  }

  private getUserAgent(): string {
    return navigator.userAgent;
  }

  private getPageUrl(): string {
    return window.location.href;
  }

  private getReferrer(): string | undefined {
    return document.referrer || undefined;
  }

  private getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  }

  private startBatchTimer() {
    this.batchTimer = setInterval(() => {
      this.flushLogs();
    }, this.batchInterval);
  }

  private setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      this.flushLogs();
    });
  }

  async logSystem(params: Omit<LogEntry, 'session_id' | 'user_agent' | 'page_url' | 'referrer'>) {
    const entry: LogEntry = {
      ...params,
      session_id: this.sessionId,
      user_agent: this.getUserAgent(),
      page_url: this.getPageUrl(),
      referrer: this.getReferrer(),
    };

    this.logQueue.push(entry);

    if (this.logQueue.length >= this.batchSize) {
      await this.flushLogs();
    }
  }

  async logApiCall(params: Omit<ApiCallLog, 'session_id'>) {
    const entry: ApiCallLog = {
      ...params,
      session_id: this.sessionId,
    };

    this.apiLogQueue.push(entry);

    if (this.apiLogQueue.length >= this.batchSize) {
      await this.flushApiLogs();
    }
  }

  async logError(params: Omit<ErrorLog, 'session_id' | 'browser_info' | 'page_url'>) {
    const errorLog: ErrorLog = {
      ...params,
      session_id: this.sessionId,
      browser_info: this.getBrowserInfo(),
      page_url: this.getPageUrl(),
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('error_logs').insert({
        ...errorLog,
        user_id: user?.id || null,
      });
    } catch (error) {
      console.error('Failed to log error:', error);
    }
  }

  async logInteraction(params: Omit<InteractionLog, 'session_id' | 'viewport_width' | 'viewport_height'>) {
    const entry: InteractionLog = {
      ...params,
      session_id: this.sessionId,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
    };

    this.interactionQueue.push(entry);

    if (this.interactionQueue.length >= this.batchSize) {
      await this.flushInteractionLogs();
    }
  }

  async logClick(element: HTMLElement, component?: string) {
    const elementText = element.textContent?.trim().substring(0, 100);
    const elementId = element.id || undefined;
    const elementClass = element.className || undefined;

    // Log as system log
    await this.logSystem({
      log_level: 'info',
      log_type: 'click',
      component,
      action: 'click',
      target: elementId || elementClass || elementText || 'unknown',
      success: true,
      metadata: {
        tagName: element.tagName,
        id: elementId,
        class: elementClass,
        text: elementText,
      },
    });

    // Log as interaction
    await this.logInteraction({
      event_type: 'click',
      element_id: elementId,
      element_class: elementClass,
      element_text: elementText,
      page_path: window.location.pathname,
      x_coordinate: undefined,
      y_coordinate: undefined,
    });
  }

  async logNavigation(to: string, from?: string) {
    await this.logSystem({
      log_level: 'info',
      log_type: 'navigation',
      action: 'navigate',
      target: to,
      success: true,
      metadata: {
        from,
        to,
      },
    });
  }

  async logFormSubmit(formName: string, success: boolean, error?: string) {
    await this.logSystem({
      log_level: success ? 'info' : 'error',
      log_type: 'form_submit',
      component: formName,
      action: 'submit',
      success,
      error_message: error,
    });
  }

  private async flushLogs() {
    if (this.logQueue.length === 0) return;

    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const logsWithUserId = logsToSend.map(log => ({
        ...log,
        user_id: user?.id || null,
      }));

      await supabase.from('system_logs').insert(logsWithUserId);
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // Re-queue failed logs
      this.logQueue.push(...logsToSend);
    }
  }

  private async flushApiLogs() {
    if (this.apiLogQueue.length === 0) return;

    const logsToSend = [...this.apiLogQueue];
    this.apiLogQueue = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const logsWithUserId = logsToSend.map(log => ({
        ...log,
        user_id: user?.id || null,
      }));

      await supabase.from('api_call_logs').insert(logsWithUserId);
    } catch (error) {
      console.error('Failed to flush API logs:', error);
      this.apiLogQueue.push(...logsToSend);
    }
  }

  private async flushInteractionLogs() {
    if (this.interactionQueue.length === 0) return;

    const logsToSend = [...this.interactionQueue];
    this.interactionQueue = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const logsWithUserId = logsToSend.map(log => ({
        ...log,
        user_id: user?.id || null,
      }));

      await supabase.from('user_interaction_logs').insert(logsWithUserId);
    } catch (error) {
      console.error('Failed to flush interaction logs:', error);
      this.interactionQueue.push(...logsToSend);
    }
  }

  destroy() {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    this.flushLogs();
    this.flushApiLogs();
    this.flushInteractionLogs();
  }
}

export const loggingService = new LoggingService();
