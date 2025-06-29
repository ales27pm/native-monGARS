import torch
import coremltools as ct
from transformers import AutoModelForCausalLM, AutoTokenizer
import os
import argparse

# --- Configuration ---
# Use an environment variable for the model ID, but default to Phi-3 mini.
DEFAULT_MODEL_ID = "microsoft/Phi-3-mini-4k-instruct"
MODEL_ID = os.environ.get("MODEL_ID", DEFAULT_MODEL_ID)
OUTPUT_DIR = "Models"
SEQ_LEN = 128 # Sequence length for the example input

class CoreMLConverter:
    def __init__(self, model_id, output_dir, seq_len):
        self.model_id = model_id
        self.output_dir = output_dir
        self.seq_len = seq_len
        self.device = torch.device("cpu") # Run on CPU for compatibility
        self.model = None
        self.tokenizer = None

        os.makedirs(self.output_dir, exist_ok=True)
        print(f"Using model: {self.model_id}")

    def load_model(self):
        """Loads the Hugging Face model and tokenizer."""
        print("Loading Hugging Face model and tokenizer...")
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_id,
            trust_remote_code=True, # Phi-3 requires this
            torch_dtype=torch.float32, # Use float32 for tracing
        ).to(self.device).eval()
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_id, trust_remote_code=True)
        print("Model and tokenizer loaded successfully.")

    def save_tokenizer(self):
        """Saves the tokenizer file required for the Swift app."""
        print(f"Saving tokenizer to {self.output_dir}/tokenizer.model")
        # The swift SentencePiece library needs the raw .model file
        # We can get this by saving the tokenizer and finding the file.
        self.tokenizer.save_pretrained(self.output_dir)
        # Rename vocab.json and merges.txt if they exist, we only need tokenizer.model
        print("Tokenizer saved.")


    def create_traced_model(self):
        """Creates a traced PyTorch model suitable for Core ML conversion."""
        print("Creating example inputs for tracing...")
        # Create a dummy input for tracing. The values don't matter, but the shape does.
        example_input_ids = torch.ones((1, self.seq_len), dtype=torch.long, device=self.device)
        example_attention_mask = torch.ones((1, self.seq_len), dtype=torch.long, device=self.device)
        
        # The model's forward pass might accept a `past_key_values` argument for kv-caching.
        # We will trace the model for the first pass (no cache).
        example_inputs = (example_input_ids, example_attention_mask)

        print("Tracing the model... This may take a moment.")
        # We trace the `forward` method of the model.
        traced_model = torch.jit.trace(self.model, example_inputs, strict=False)
        print("Model traced successfully.")
        return traced_model, example_inputs

    def convert(self, quantization_mode="float16"):
        """Converts the traced model to Core ML format."""
        if self.model is None or self.tokenizer is None:
            self.load_model()
            self.save_tokenizer()

        traced_model, example_inputs = self.create_traced_model()

        print(f"Converting model to Core ML with {quantization_mode} quantization...")

        # Define the input tensors for the Core ML model
        # The names 'input_ids' and 'attention_mask' will be the input names in Xcode.
        inputs = [
            ct.TensorType(name="input_ids", shape=example_inputs[0].shape, dtype=torch.int32),
            ct.TensorType(name="attention_mask", shape=example_inputs[1].shape, dtype=torch.int32),
        ]
        
        # Define the output quantization
        if quantization_mode == "float16":
            compute_precision = ct.precision.FLOAT16
        else:
            compute_precision = ct.precision.FLOAT32

        # Convert the model
        mlmodel = ct.convert(
            traced_model,
            inputs=inputs,
            convert_to="mlprogram", # Use the modern mlprogram format
            compute_units=ct.ComputeUnit.CPU_AND_GPU, # Allow flexible deployment
            minimum_deployment_target=ct.target.iOS16, # Target a reasonable iOS version
            compute_precision=compute_precision,
        )

        output_path = os.path.join(self.output_dir, "LLM.mlmodel")
        print(f"Saving Core ML model to {output_path}")
        mlmodel.save(output_path)
        print("Conversion complete!")


def main():
    parser = argparse.ArgumentParser(description="Convert Hugging Face models to Core ML.")
    parser.add_argument(
        "--quantization",
        type=str,
        choices=["float16", "float32"],
        default="float16",
        help="The quantization mode for the model.",
    )
    args = parser.parse_args()

    converter = CoreMLConverter(
        model_id=MODEL_ID,
        output_dir=OUTPUT_DIR,
        seq_len=SEQ_LEN
    )
    converter.convert(args.quantization)


if __name__ == "__main__":
    main()