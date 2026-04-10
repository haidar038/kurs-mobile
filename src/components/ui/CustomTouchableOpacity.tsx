import { TouchableOpacity } from "react-native";

// Set global default activeOpacity for all TouchableOpacity instances
TouchableOpacity.defaultProps = {
    ...TouchableOpacity.defaultProps,
    activeOpacity: 0.75,
};

export { TouchableOpacity };