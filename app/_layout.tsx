import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { Dimensions, Image, Platform, StyleSheet, View } from "react-native";
import { UserNamesProvider } from "@/context/UserNamesContext";
import { ThemeProvider, useThemeColors } from "@/context/ThemeContext";

try {
  SplashScreen.preventAutoHideAsync();
} catch {}

function AppSplash() {
  return (
    <View style={styles.splashContainer}>
      <Image
        source={require("../assets/images/icon.png")}
        style={styles.splashImage}
        resizeMode="contain"
      />
    </View>
  );
}

function RootLayoutNav() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="roastery/[id]" />
      <Stack.Screen name="coffee/[id]" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const syncDimensions = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scale = window.devicePixelRatio || 1;
      Dimensions.set({
        window: { width: w, height: h, scale, fontScale: 1 },
        screen: { width: window.screen.width, height: window.screen.height, scale, fontScale: 1 },
      });
    };
    const onFocusOut = () => {
      setTimeout(syncDimensions, 100);
      setTimeout(syncDimensions, 350);
      setTimeout(syncDimensions, 700);
    };
    window.addEventListener("resize", syncDimensions);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      window.removeEventListener("resize", syncDimensions);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded && !fontError) return <AppSplash />;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <UserNamesProvider>
            <GestureHandlerRootView>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </UserNamesProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  splashImage: {
    width: "70%",
    height: "70%",
  },
});
