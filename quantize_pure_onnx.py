import os
import shutil
from huggingface_hub import snapshot_download
from onnxruntime.quantization import quantize_dynamic, QuantType

raw_dir = "./whisper-fp32"
output_dir = "./whisper-onnx-int8"

# Bersihkan folder output lama agar tidak menumpuk
if os.path.exists(output_dir):
    shutil.rmtree(output_dir)

print("1. Mengunduh berkas mentah dari HF...")
snapshot_download(
    repo_id="Xenova/whisper-tiny",
    local_dir=raw_dir,
    allow_patterns=["onnx/*.onnx", "*.json"]
)

os.makedirs(os.path.join(output_dir, "onnx"), exist_ok=True)

# Salin konfigurasi JSON
for item in os.listdir(raw_dir):
    if item.endswith(".json"):
        shutil.copy(os.path.join(raw_dir, item), output_dir)

onnx_fp32_dir = os.path.join(raw_dir, "onnx")

# Hanya proses 4 berkas FP32 standar (Abaikan q4, bnb4, int8 bawaan)
target_files = [
    "encoder_model.onnx",
    "decoder_model_merged.onnx",
    "decoder_model.onnx",
    "decoder_with_past_model.onnx"
]

print("\n2. Melakukan Kuantisasi INT8 murni pada berkas FP32...")
for file in target_files:
    input_path = os.path.join(onnx_fp32_dir, file)
    if os.path.exists(input_path):
        base_name = os.path.splitext(file)[0]
        out_name = f"{base_name}_quantized.onnx"
        output_path = os.path.join(output_dir, "onnx", out_name)
        
        print(f"  Mengompresi: {file} -> onnx/{out_name}")
        quantize_dynamic(
            model_input=input_path,
            model_output=output_path,
            weight_type=QuantType.QUInt8,
            per_channel=True,
            reduce_range=True
        )

print(f"\nKuantisasi INT8 Bersih Selesai! Berkas tersimpan di: {output_dir}/onnx")