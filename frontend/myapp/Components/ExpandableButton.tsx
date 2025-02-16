import React, { useRef } from "react";
import { TouchableOpacity, Animated, View } from "react-native";

const ExpandableButton = ({
  id,
  text,
  IconComponent,
  iconName,
  activeId,
  setActiveId,
  onPress,
}: {
  id: number;
  text: string;
  IconComponent: React.ElementType;
  iconName: string;
  activeId: number | null;
  setActiveId: (id: number) => void;
  onPress: (id: number) => void;
}) => {
  const isActive = activeId === id;
  const widthAnim = useRef(new Animated.Value(isActive ? 175 : 55)).current;

  React.useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: isActive ? 175 : 55,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const handlePress = () => {
    if (!isActive) setActiveId(id);
    onPress(id);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View
        className="flex-row items-center justify-start rounded-[20px] py-2.5 px-4 h-12 overflow-hidden"
        style={[
          { width: widthAnim, backgroundColor: isActive ? "#5CB868" : "#F3F4F6" },
        ]}
      >
        <View className="w-8 justify-start">
          <IconComponent name={iconName} size={24} color={isActive ? "#fff" : "#5CB868"} />
        </View>
        {isActive && (
          <Animated.Text
            className="text-white text-base ml-4 absolute left-10"
            style={{
              opacity: widthAnim.interpolate({
                inputRange: [50, 180],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            }}
          >
            {text}
          </Animated.Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default ExpandableButton;