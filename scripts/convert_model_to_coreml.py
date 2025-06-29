#!/usr/bin/env python3
"""
Core ML Model Conversion Script for native-monGARS
Converts Hugging Face models to Core ML format for on-device inference
"""

import os
import json
import argparse
from pathlib import Path
from typing import Optional, Dict, Any

import torch
import coremltools as ct
from transformers import AutoTokenizer, AutoModelForCausalLM
from transformers.models.auto import modeling_auto
import numpy as np


class CoreMLConverter:
    """Handles conversion of Hugging Face models to Core ML format"""
    
    def __init__(self, model_name: str, output_dir: str = "Models"):
        self.model_name = model_name
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Model configuration
        self.max_length = 512  # Maximum sequence length
        self.vocab_size = None
        self.model_info = {}
        
    def load_model_and_tokenizer(self, quantization: str = "int8"):
        """Load the Hugging Face model and tokenizer"""
        print(f"Loading model: {self.model_name}")
        
        try:
            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                trust_remote_code=True,
                padding_side="left"
            )
            
            # Add pad token if not present
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
                
            self.vocab_size = len(self.tokenizer)
            
            # Load model with appropriate precision
            torch_dtype = torch.float16 if quantization == "float16" else torch.float32
            
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                torch_dtype=torch_dtype,
                trust_remote_code=True,
                device_map="cpu",  # Force CPU for Core ML conversion
                low_cpu_mem_usage=True
            )
            
            # Set model to evaluation mode
            self.model.eval()
            
            print(f"✅ Model loaded successfully")
            print(f"   Vocab size: {self.vocab_size}")
            print(f"   Model parameters: {sum(p.numel() for p in self.model.parameters()):,}")
            
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            raise
    
    def create_traced_model(self):
        """Create a traced version of the model for Core ML conversion"""
        print("Creating traced model...")
        
        # Create example inputs
        batch_size = 1
        sequence_length = 128  # Smaller for tracing
        
        # Example input IDs
        input_ids = torch.randint(0, self.vocab_size, (batch_size, sequence_length))
        attention_mask = torch.ones_like(input_ids)
        
        # Trace the model
        with torch.no_grad():
            try:
                traced_model = torch.jit.trace(
                    self.model,
                    (input_ids, attention_mask),
                    strict=False
                )
                print("✅ Model traced successfully")
                return traced_model, (input_ids, attention_mask)
                
            except Exception as e:
                print(f"❌ Error tracing model: {e}")
                # Fallback to scripting if tracing fails
                return self.create_scripted_model()
    
    def create_scripted_model(self):
        """Create a scripted version of the model as fallback"""
        print("Creating scripted model...")
        
        try:
            scripted_model = torch.jit.script(self.model)
            
            # Create example inputs
            batch_size = 1
            sequence_length = 128
            input_ids = torch.randint(0, self.vocab_size, (batch_size, sequence_length))
            attention_mask = torch.ones_like(input_ids)
            
            print("✅ Model scripted successfully")
            return scripted_model, (input_ids, attention_mask)
            
        except Exception as e:
            print(f"❌ Error scripting model: {e}")
            raise
    
    def convert_to_coreml(self, torch_model, example_inputs, quantization: str = "int8"):
        """Convert the PyTorch model to Core ML format"""
        print(f"Converting to Core ML with {quantization} quantization...")
        
        input_ids, attention_mask = example_inputs
        
        try:
            # Define input specifications
            input_spec = [
                ct.TensorType(
                    name="input_ids",
                    shape=input_ids.shape,
                    dtype=np.int32
                ),
                ct.TensorType(
                    name="attention_mask", 
                    shape=attention_mask.shape,
                    dtype=np.int32
                )
            ]
            
            # Convert to Core ML
            coreml_model = ct.convert(
                torch_model,
                inputs=input_spec,
                compute_units=ct.ComputeUnit.CPU_AND_NE,  # Neural Engine when available
                minimum_deployment_target=ct.target.iOS16,
                convert_to="mlprogram"
            )
            
            # Apply quantization
            if quantization == "int8":
                coreml_model = ct.optimize.coreml.linear_quantize_weights(
                    coreml_model, 
                    mode="linear_symmetric"
                )
            elif quantization == "int4":
                coreml_model = ct.optimize.coreml.linear_quantize_weights(
                    coreml_model,
                    mode="linear_symmetric",
                    dtype=ct.optimize.coreml.OptimizationConfig.int4
                )
            
            print(f"✅ Core ML conversion completed with {quantization} quantization")
            return coreml_model
            
        except Exception as e:
            print(f"❌ Error converting to Core ML: {e}")
            raise
    
    def save_tokenizer(self):
        """Save the tokenizer in a format suitable for iOS"""
        print("Saving tokenizer...")
        
        try:
            # Save tokenizer files
            tokenizer_dir = self.output_dir / "tokenizer"
            tokenizer_dir.mkdir(exist_ok=True)
            
            self.tokenizer.save_pretrained(str(tokenizer_dir))
            
            # Create a simplified tokenizer info file for iOS
            tokenizer_info = {
                "vocab_size": self.vocab_size,
                "model_max_length": self.tokenizer.model_max_length,
                "pad_token": self.tokenizer.pad_token,
                "eos_token": self.tokenizer.eos_token,
                "bos_token": self.tokenizer.bos_token,
                "unk_token": self.tokenizer.unk_token,
                "pad_token_id": self.tokenizer.pad_token_id,
                "eos_token_id": self.tokenizer.eos_token_id,
                "bos_token_id": self.tokenizer.bos_token_id,
                "unk_token_id": self.tokenizer.unk_token_id,
            }
            
            with open(self.output_dir / "tokenizer_info.json", "w") as f:
                json.dump(tokenizer_info, f, indent=2)
            
            print("✅ Tokenizer saved successfully")
            
        except Exception as e:
            print(f"❌ Error saving tokenizer: {e}")
            raise
    
    def save_model_info(self, quantization: str):
        """Save model metadata"""
        model_info = {
            "model_name": self.model_name,
            "quantization": quantization,
            "vocab_size": self.vocab_size,
            "max_length": self.max_length,
            "conversion_date": str(torch.utils.data.get_worker_info()),
            "pytorch_version": torch.__version__,
            "coremltools_version": ct.__version__,
        }
        
        with open(self.output_dir / "model_info.json", "w") as f:
            json.dump(model_info, f, indent=2)
        
        print("✅ Model info saved")
    
    def convert(self, quantization: str = "int8"):
        """Main conversion pipeline"""
        print(f"Starting conversion of {self.model_name} to Core ML...")
        print(f"Output directory: {self.output_dir}")
        print(f"Quantization: {quantization}")
        print("-" * 50)
        
        # Load model and tokenizer
        self.load_model_and_tokenizer(quantization)
        
        # Create traced/scripted model
        torch_model, example_inputs = self.create_traced_model()
        
        # Convert to Core ML
        coreml_model = self.convert_to_coreml(torch_model, example_inputs, quantization)
        
        # Save Core ML model
        model_path = self.output_dir / "LLM.mlmodel"
        coreml_model.save(str(model_path))
        print(f"✅ Core ML model saved to: {model_path}")
        
        # Save tokenizer
        self.save_tokenizer()
        
        # Save model info
        self.save_model_info(quantization)
        
        print("-" * 50)
        print("🎉 Conversion completed successfully!")
        print(f"📁 Output files:")
        print(f"   - {model_path}")
        print(f"   - {self.output_dir}/tokenizer/")
        print(f"   - {self.output_dir}/tokenizer_info.json")
        print(f"   - {self.output_dir}/model_info.json")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Convert Hugging Face models to Core ML")
    parser.add_argument(
        "--model",
        type=str,
        default=os.getenv("MODEL_NAME", "microsoft/Phi-3-mini-4k-instruct"),
        help="Hugging Face model name"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="Models",
        help="Output directory"
    )
    parser.add_argument(
        "--quantization",
        type=str,
        choices=["float16", "int8", "int4"],
        default=os.getenv("QUANTIZATION", "int8"),
        help="Quantization level"
    )
    
    args = parser.parse_args()
    
    # Create converter and run conversion
    converter = CoreMLConverter(args.model, args.output)
    converter.convert(args.quantization)


if __name__ == "__main__":
    main()