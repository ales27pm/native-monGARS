import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '../utils/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    retry: () => void;
    showDetails: boolean;
    toggleDetails: () => void;
  }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary', 'React Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      errorInfo,
    });
  }

  handleRetry = () => {
    logger.info('ErrorBoundary', 'User triggered error retry');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            retry={this.handleRetry}
            showDetails={this.state.showDetails}
            toggleDetails={this.toggleDetails}
          />
        );
      }

      // Default error UI
      return (
        <SafeAreaView className="flex-1 bg-red-50">
          <View className="flex-1 px-6 py-8">
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-red-500 rounded-full items-center justify-center mb-4">
                <Ionicons name="warning" size={40} color="white" />
              </View>
              <Text className="text-2xl font-bold text-red-900 mb-2">
                Oops! Something went wrong
              </Text>
              <Text className="text-red-700 text-center leading-relaxed">
                We encountered an unexpected error. Don't worry, your data is safe.
              </Text>
            </View>

            <View className="space-y-4 mb-8">
              <Pressable
                onPress={this.handleRetry}
                className="bg-red-600 py-4 px-6 rounded-2xl active:bg-red-700"
              >
                <Text className="text-white font-bold text-center text-lg">
                  Try Again
                </Text>
              </Pressable>

              <Pressable
                onPress={this.toggleDetails}
                className="bg-gray-200 py-4 px-6 rounded-2xl active:bg-gray-300"
              >
                <Text className="text-gray-700 font-semibold text-center">
                  {this.state.showDetails ? 'Hide' : 'Show'} Error Details
                </Text>
              </Pressable>
            </View>

            {this.state.showDetails && (
              <ScrollView className="flex-1 bg-gray-100 rounded-2xl p-4">
                <Text className="text-sm font-mono text-gray-800 mb-4">
                  <Text className="font-bold">Error:</Text>
                  {'\n'}
                  {this.state.error?.message || 'Unknown error'}
                </Text>

                {this.state.error?.stack && (
                  <Text className="text-xs font-mono text-gray-600 mb-4">
                    <Text className="font-bold">Stack Trace:</Text>
                    {'\n'}
                    {this.state.error.stack}
                  </Text>
                )}

                {this.state.errorInfo?.componentStack && (
                  <Text className="text-xs font-mono text-gray-600">
                    <Text className="font-bold">Component Stack:</Text>
                    {'\n'}
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}

            <View className="mt-6 p-4 bg-blue-50 rounded-2xl">
              <Text className="text-blue-800 text-sm text-center">
                If this problem persists, please restart the app or contact support.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

// Custom hook for error boundary
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      logger.error('ErrorHandler', 'Error caught by error handler', error);
      throw error;
    }
  }, [error]);

  return setError;
}

export default ErrorBoundary;