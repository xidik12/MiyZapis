/**
 * Error Boundary component
 * Catches JavaScript errors anywhere in the component tree and displays fallback UI
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { PRIMARY_COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../utils/design';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch and handle errors
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              <Text style={styles.emoji}>⚠️</Text>
              <Text style={styles.title}>Oops! Something went wrong</Text>
              <Text style={styles.message}>
                We're sorry for the inconvenience. The app encountered an unexpected error.
              </Text>

              {__DEV__ && this.state.error && (
                <View style={styles.errorDetails}>
                  <Text style={styles.errorTitle}>Error Details (Dev Mode)</Text>
                  <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                  {this.state.errorInfo && (
                    <Text style={styles.errorStack}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  )}
                </View>
              )}

              <TouchableOpacity style={styles.button} onPress={this.handleReset}>
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  content: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  message: {
    ...TYPOGRAPHY.body,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  errorDetails: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorTitle: {
    ...TYPOGRAPHY.bodySm,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: SPACING.sm,
  },
  errorText: {
    ...TYPOGRAPHY.bodySm,
    color: '#991B1B',
    fontFamily: 'monospace',
    marginBottom: SPACING.sm,
  },
  errorStack: {
    ...TYPOGRAPHY.caption,
    color: '#DC2626',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: PRIMARY_COLORS[600],
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 150,
  },
  buttonText: {
    ...TYPOGRAPHY.body,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ErrorBoundary;
