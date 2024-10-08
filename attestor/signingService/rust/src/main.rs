use rand_chacha::{ChaChaRng, rand_core::SeedableRng};
use snarkvm::console::account::{PrivateKey,Signature};
use snarkvm::console::algorithms::{ToFields, ToBits,Address};
use snarkvm::console::network::MainnetV0;
use snarkvm::console::program::{Plaintext,Literal,Network, LiteralType};
use wasm_bindgen::prelude::*;

use std::{str::FromStr, env};

pub fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len()<2{
        help();
        return;
    }
    match args[1].as_str() {
        "sign"=> {
            if args.len() != 4 {
                help();
                panic!("invalid syntax")
            } 
            let signature = sign(args[2].as_str(), args[3].as_str());
            print!("{}", signature);

        },
        "hash"=> {
            if args.len() != 5 {
                help();
                panic!("invalid syntax")
            }
            let hash = hash(args[2].as_str(), args[3].as_str(), args[4].as_str());
            print!("{}", hash);
        },
        "derive-addr" => {
            if args.len() != 3 {
                help();
                panic!("invalid syntax")
            }
            let addr = derive_address(args[2].as_str());
            print!("{}", addr)
        }
        _=>help(),
    }
}

pub fn sign(private_key: &str, message: &str) -> String {
    let input = Plaintext::<MainnetV0>::from_str(message).unwrap();
    let account = PrivateKey::<MainnetV0>::from_str(private_key).unwrap();
    let mut rng: rand_chacha::ChaCha20Rng = ChaChaRng::from_entropy();
    let signature = account.sign(&input.to_fields().unwrap(), &mut rng).unwrap();
    signature.to_string()
}

pub fn derive_address(private_key: &str) -> String {
    let account = PrivateKey::<MainnetV0>::from_str(private_key).unwrap();
    let address = Address::try_from(account).unwrap().to_string();
    address
}

pub fn sign_verify(sign: &str, address: &str, message: &str) -> bool {
    let signature = Signature::<MainnetV0>::from_str(sign).unwrap();
    let address = Address::<MainnetV0>::from_str(address).unwrap();
    let message = Plaintext::<MainnetV0>::from_str(message).unwrap();
    signature.verify(&address, &message.to_fields().unwrap())
}

pub fn help() {
    print!("\n\n\n");
    println!("************************** aleoHelper **************************");
    print!("\n");
    println!("aleoHelper <options> <arguments>...");
    println!("    options");
    println!("         - sign <privatekey> <message>");
    println!("         - hash <algorithm> <input> <hash output>");
    println!("         - derive-addr <private-key>");
    print!("\n\n");
    println!("************************** aleoHelper **************************");
}


#[wasm_bindgen]
pub fn hash(algorithm: &str, val: &str, output: &str) -> String {
    let input = Plaintext::<MainnetV0>::from_str(val).unwrap();
    let destination = LiteralType::from_str(output).unwrap();

    let output = match algorithm {
        "bhp256" => MainnetV0::hash_to_group_bhp256(&input.to_bits_le()).unwrap(),
        "bhp512" => MainnetV0::hash_to_group_bhp512(&input.to_bits_le()).unwrap(),
        "bhp768" => MainnetV0::hash_to_group_bhp768(&input.to_bits_le()).unwrap(),
        "bhp1024" => MainnetV0::hash_to_group_bhp1024(&input.to_bits_le()).unwrap(),
        "keccak256" => MainnetV0::hash_to_group_bhp256(&MainnetV0::hash_keccak256(&input.to_bits_le()).unwrap()).unwrap(),
        "ped64" => MainnetV0::hash_to_group_ped64(&input.to_bits_le()).unwrap(),
        "ped128" => MainnetV0::hash_to_group_ped128(&input.to_bits_le()).unwrap(),
        "sha3_256" => MainnetV0::hash_to_group_bhp256(&MainnetV0::hash_sha3_256(&input.to_bits_le()).unwrap()).unwrap(),
        "sha3_384" => MainnetV0::hash_to_group_bhp512(&MainnetV0::hash_sha3_384(&input.to_bits_le()).unwrap()).unwrap(),
        "sha3_512" => MainnetV0::hash_to_group_bhp512(&MainnetV0::hash_sha3_512(&input.to_bits_le()).unwrap()).unwrap(),
        _ => panic!("algorithm not supported")
    };
    let literal_output = Literal::Group(output);
    let casted = literal_output.cast_lossy(destination).unwrap();
    casted.to_string()
}

#[test]
fn test_sign() {
    let private_key = "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH";
    let message = "1233032529535352533537970719453602118145153682706641379905676168317090198721field";
    let signature = sign(private_key, message);

    let account = PrivateKey::<MainnetV0>::from_str(private_key).unwrap();
    let address = Address::try_from(account).unwrap().to_string();

   assert!(sign_verify(&signature, &address, message))
}

#[test]
fn test_hash() {
    let input: &str = "{ packet_hash:6608592228629500387683976240387025223981477222757036896067688243133631109522field, screening_passed:true }";
    let output: &str = LiteralType::type_name(&LiteralType::Field);
    let algorithm: &str = "bhp256";
    let hash: String = hash(algorithm, input, output);

    let expected_sting = "1233032529535352533537970719453602118145153682706641379905676168317090198721field";
    assert_eq!(expected_sting, hash);
}
