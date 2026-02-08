import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTitleAlign: "center",
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" options={{ title: "Daton ESG" }} />
      </Stack>
    </QueryClientProvider>
  );
}
