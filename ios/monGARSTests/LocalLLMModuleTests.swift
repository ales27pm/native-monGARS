import XCTest
@testable import monGARS

class LocalLLMModuleTests: XCTestCase {
    
    var localLLMModule: LocalLLMModule!
    
    override func setUpWithError() throws {
        super.setUp()
        localLLMModule = LocalLLMModule()
    }
    
    override func tearDownWithError() throws {
        localLLMModule = nil
        super.tearDown()
    }
    
    func testGetAvailableModels() throws {
        let expectation = XCTestExpectation(description: "Get available models")
        
        localLLMModule.getAvailableModels({ models in
            XCTAssertNotNil(models)
            if let modelsArray = models as? [[String: Any]] {
                XCTAssertFalse(modelsArray.isEmpty, "Should have at least one model")
                
                let firstModel = modelsArray[0]
                XCTAssertNotNil(firstModel["id"])
                XCTAssertNotNil(firstModel["name"])
                XCTAssertEqual(firstModel["id"] as? String, "llama-3.2-3b-instruct")
            }
            expectation.fulfill()
        }, rejecter: { _, _, _ in
            XCTFail("Should not reject")
            expectation.fulfill()
        })
        
        wait(for: [expectation], timeout: 5.0)
    }
    
    func testGenerateText() throws {
        let expectation = XCTestExpectation(description: "Generate text")
        
        let prompt = "Hello, how are you?"
        let options: [String: Any] = [
            "maxTokens": 100,
            "temperature": 0.7
        ]
        
        localLLMModule.generateText(prompt, options: options, resolver: { response in
            XCTAssertNotNil(response)
            if let responseDict = response as? [String: Any] {
                XCTAssertNotNil(responseDict["text"])
                XCTAssertNotNil(responseDict["tokensGenerated"])
                XCTAssertNotNil(responseDict["inferenceTime"])
                
                let generatedText = responseDict["text"] as? String
                XCTAssertTrue(generatedText?.contains(prompt) == true, "Response should contain the original prompt")
            }
            expectation.fulfill()
        }, rejecter: { _, _, _ in
            XCTFail("Should not reject")
            expectation.fulfill()
        })
        
        wait(for: [expectation], timeout: 10.0)
    }
    
    func testDownloadModel() throws {
        let expectation = XCTestExpectation(description: "Download model")
        
        localLLMModule.downloadModel("llama-3.2-3b-instruct", resolver: { success in
            XCTAssertNotNil(success)
            if let isSuccess = success as? Bool {
                XCTAssertTrue(isSuccess, "Download should succeed")
            }
            expectation.fulfill()
        }, rejecter: { _, _, _ in
            XCTFail("Should not reject")
            expectation.fulfill()
        })
        
        wait(for: [expectation], timeout: 15.0)
    }
    
    func testLoadModel() throws {
        let expectation = XCTestExpectation(description: "Load model")
        
        localLLMModule.loadModel("llama-3.2-3b-instruct", resolver: { success in
            XCTAssertNotNil(success)
            if let isSuccess = success as? Bool {
                XCTAssertTrue(isSuccess, "Load should succeed")
            }
            expectation.fulfill()
        }, rejecter: { _, _, _ in
            XCTFail("Should not reject")
            expectation.fulfill()
        })
        
        wait(for: [expectation], timeout: 10.0)
    }
}