import React from 'react'
import {
  BoxEntity,
  ConeEntity,
  CylinderEntity,
  Entity,
  ModelEntity,
  PlaneEntity,
  SphereEntity,
} from './components'

const runtimeName: string = 'runtime-name'

void (<Entity name="validName" />)
void (<Entity name="valid_name" />)
void (<Entity name={runtimeName} />)

// @ts-expect-error Entity names must not include hyphens.
void (<Entity name="invalid-name" />)

void (<BoxEntity name="validBox" />)
// @ts-expect-error BoxEntity names must not include hyphens.
void (<BoxEntity name="invalid-box" />)

void (<SphereEntity name="validSphere" />)
// @ts-expect-error SphereEntity names must not include hyphens.
void (<SphereEntity name="invalid-sphere" />)

void (<PlaneEntity name="validPlane" />)
// @ts-expect-error PlaneEntity names must not include hyphens.
void (<PlaneEntity name="invalid-plane" />)

void (<ConeEntity name="validCone" />)
// @ts-expect-error ConeEntity names must not include hyphens.
void (<ConeEntity name="invalid-cone" />)

void (<CylinderEntity name="validCylinder" />)
// @ts-expect-error CylinderEntity names must not include hyphens.
void (<CylinderEntity name="invalid-cylinder" />)

void (<ModelEntity model="asset" name="validModel" />)
// @ts-expect-error ModelEntity names must not include hyphens.
void (<ModelEntity model="asset" name="invalid-model" />)
