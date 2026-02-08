import { Link } from "expo-router";
import { Pressable, SafeAreaView, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-1 px-6 py-8">
        <Text className="text-3xl font-bold text-slate-900">Daton ESG</Text>
        <Text className="mt-2 text-base text-slate-600">
          iOS app scaffolded with Expo Router + Uniwind.
        </Text>

        <View className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <Text className="text-sm font-semibold text-slate-800">
            Initial migration scope
          </Text>
          <Text className="mt-2 text-sm text-slate-600">
            ESG Social, Qualidade and Fornecedores will be implemented in
            upcoming PRs with shared contracts.
          </Text>
        </View>

        <Link href="/" asChild>
          <Pressable className="mt-8 rounded-xl bg-slate-900 px-4 py-3 active:opacity-80">
            <Text className="text-center text-sm font-semibold text-white">
              iOS Preview Ready
            </Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}
