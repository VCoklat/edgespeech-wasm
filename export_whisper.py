import os
from optimum.onnxruntime import ORTModelForSpeechSeq2Seq
from transformers import AutoProcessor
from onnxruntime.quantization import quantize_dynamic, QuantType

model_id = "openai/whisper-tiny"
raw_dir = "./whisper-raw"
output_dir = "./whisper-onnx-output"

print("1. Mengekspor model ONNX (Encoder & Decoder)...")
model = ORTModelForSpeechSeq2Seq.from_pretrained(model_id, export=True)
processor = AutoProcessor.from_pretrained(model_id)

model.save_pretrained(raw_dir)
processor.save_pretrained(raw_dir)

print("2. Melakukan kuantisasi INT8...")
os.makedirs(os.path.join(output_dir, "onnx"), exist_ok=True)
processor.save_pretrained(output_dir)

for file in os.listdir(raw_dir):
    if file.endswith(".onnx"):
        input_path = os.path.join(raw_dir, file)
        out_name = file.replace(".onnx", "_quantized.onnx")
        output_path = os.path.join(output_dir, "onnx", out_name)
        print(f"  Memproses {file} -> {out_name}...")
        quantize_dynamic(input_path, output_path, weight_type=QuantType.QUInt8)

print(f"\nSelesai! Berkas ONNX INT8 tersimpan di: {output_dir}/onnx")