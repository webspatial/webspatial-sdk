// src/models/types.ts

/**
 * 三维向量
 */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * 二维向量
 */
export interface Vec2 {
  x: number;
  y: number;
}

/**
 * 变换信息
 */
export interface Transform {
  position?: Vec3;
  rotation?: Vec3;
  scale?: Vec3;
}

/**
 * 圆角半径
 */
export interface CornerRadius {
  topLeft?: number;
  topRight?: number;
  bottomLeft?: number;
  bottomRight?: number;
}

/**
 * 空间化元素属性
 */
export interface SpatializedElementProperties {
  name?: string;
  width?: number;
  height?: number;
  depth?: number;
  rotationAnchor?: Vec3;
  opacity?: number;
  visible?: boolean;
  scrollWithParent?: boolean;
  zIndex?: number;
  clip?: boolean;
  enableGesture?: boolean;
}

/**
 * 2D空间化元素属性
 */
export interface Spatialized2DElementProperties extends SpatializedElementProperties {
  scrollEnabled?: boolean;
  material?: 'None' | 'Translucent' | 'Transparent';
  cornerRadius?: CornerRadius;
  scrollEdgeInsetsMarginRight?: number;
}