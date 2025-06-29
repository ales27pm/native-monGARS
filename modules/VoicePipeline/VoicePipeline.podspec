require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "VoicePipeline"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]
  
  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "file:///#{__dir__}" }
  
  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.requires_arc = true
  
  s.dependency "React-Core"
  s.dependency "React-Codegen"
  s.dependency "ReactCommon/turbomodule/core"
  
  # iOS frameworks for speech and audio
  s.frameworks = "AVFoundation", "Speech", "Foundation", "AudioToolbox"
  
  # Swift version
  s.swift_version = "5.0"
  
  # Enable module maps for mixed language support
  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "SWIFT_OPTIMIZATION_LEVEL" => "-O",
    "OTHER_SWIFT_FLAGS" => "-Xfrontend -warn-long-function-bodies=100 -Xfrontend -warn-long-expression-type-checking=100"
  }
end