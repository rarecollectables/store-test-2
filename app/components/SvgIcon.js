import React from 'react';
import Svg, { Path, G } from 'react-native-svg';

// Home outline icon
export const HomeOutlineIcon = ({ size = 24, color = '#000', style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <G fill="none">
        <Path 
          d="M12,2.09814815 L21.9259259,11.1481481 L21.9259259,21.9259259 L14.0740741,21.9259259 L14.0740741,15.1111111 L9.92592593,15.1111111 L9.92592593,21.9259259 L2.07407407,21.9259259 L2.07407407,11.1481481 L12,2.09814815 Z M12,4.33333333 L4.14814815,11.5 L4.14814815,19.8518519 L7.85185185,19.8518519 L7.85185185,13.037037 L16.1481481,13.037037 L16.1481481,19.8518519 L19.8518519,19.8518519 L19.8518519,11.5 L12,4.33333333 Z" 
          fill={color}
        />
      </G>
    </Svg>
  );
};

// Shopping bag outline icon
export const ShoppingBagOutlineIcon = ({ size = 24, color = '#000', style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <G fill="none">
        <Path 
          d="M7,8 L7,6 C7,3.23857625 9.23857625,1 12,1 C14.7614237,1 17,3.23857625 17,6 L17,8 L20,8 C20.5522847,8 21,8.44771525 21,9 L21,21 C21,21.5522847 20.5522847,22 20,22 L4,22 C3.44771525,22 3,21.5522847 3,21 L3,9 C3,8.44771525 3.44771525,8 4,8 L7,8 Z M5,10 L5,20 L19,20 L19,10 L5,10 Z M9,8 L15,8 L15,6 C15,4.34314575 13.6568542,3 12,3 C10.3431458,3 9,4.34314575 9,6 L9,8 Z" 
          fill={color}
        />
      </G>
    </Svg>
  );
};
