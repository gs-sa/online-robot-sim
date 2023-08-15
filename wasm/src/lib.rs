mod utils;

use modern_robotics_rs::{
    kinematics::ik_space,
    nalgebra::{Matrix4, SVector, Vector6},
    parse_urdf_string,
};

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Robot {
    m: Matrix4<f64>,
    s_list: [Vector6<f64>; 7],
}

#[wasm_bindgen]
impl Robot {
    #[wasm_bindgen(constructor)]
    pub fn new(urdf: &str, tip: &str) -> Robot {
        let (m_list, s_list_) = parse_urdf_string(urdf, tip);
        let mut s_list = [Vector6::<f64>::zeros(); 7];
        s_list.copy_from_slice(&s_list_);
        Robot {
            m: *m_list.last().unwrap(),
            s_list,
        }
    }

    pub fn ik(&self, target: Vec<f64>, init: Vec<f64>) -> Result<Vec<f64>, bool> {
        let target = Matrix4::<f64>::from_column_slice(&target);
        let init = SVector::<f64, 7>::from_vec(init);
        match ik_space(&self.m, &self.s_list, &target, &init, 1e-4, 1e-4, 10) {
            Ok((joints, is_ok)) => {
                if is_ok {
                    Ok(joints.as_slice().to_vec())
                } else {
                    Err(false)
                }
            }
            Err(_) => Err(false),
        }
    }
}
