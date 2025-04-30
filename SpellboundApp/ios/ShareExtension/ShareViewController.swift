import UIKit
import Social
import MobileCoreServices
import UniformTypeIdentifiers

class ShareViewController: UIViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Extract shared text and open main app
        extractSharedText { text in
            if let text = text {
                self.openMainApp(with: text)
            } else {
                self.dismiss()
            }
        }
    }
    
    func extractSharedText(completion: @escaping (String?) -> Void) {
        let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem
        let contentTypeText = UTType.text.identifier
        let contentTypePlainText = UTType.plainText.identifier
        
        // Find the text attachment
        if let attachments = extensionItem?.attachments {
            for attachment in attachments {
                if attachment.hasItemConformingToTypeIdentifier(contentTypeText) {
                    attachment.loadItem(forTypeIdentifier: contentTypeText, options: nil) { data, error in
                        if let text = data as? String {
                            completion(text)
                        } else {
                            completion(nil)
                        }
                    }
                    return
                } else if attachment.hasItemConformingToTypeIdentifier(contentTypePlainText) {
                    attachment.loadItem(forTypeIdentifier: contentTypePlainText, options: nil) { data, error in
                        if let text = data as? String {
                            completion(text)
                        } else {
                            completion(nil)
                        }
                    }
                    return
                }
            }
        }
        
        completion(nil)
    }
    
    func openMainApp(with text: String) {
        // Create a URL with the shared text
        let urlString = "spellbound://share?text=\(text.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"
        
        if let url = URL(string: urlString) {
            let selector = sel_registerName("openURL:")
            var responder = self as UIResponder
            
            // Find the responder that can handle the openURL selector
            while let nextResponder = responder.next {
                if nextResponder.responds(to: selector) {
                    nextResponder.perform(selector, with: url)
                    break
                }
                responder = nextResponder
            }
        }
        
        dismiss()
    }
    
    func dismiss() {
        extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
    }
} 