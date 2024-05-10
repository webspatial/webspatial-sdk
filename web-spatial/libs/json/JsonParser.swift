//
//  JsonParser.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import Foundation

class JsonParser {
    var json: [String:AnyObject]? = nil
    init(str:String?){
        if let toParse = str {
            if let data = toParse.data(using: .utf8) {
                do {
                    json = try JSONSerialization.jsonObject(with: data, options: .mutableContainers) as? [String:AnyObject]
                }catch {
                }
            }
        }
    }
    
    func getValue<T>(lookup: [String])->T?{
        if var anyObj = json as? AnyObject {
            for (index, str) in lookup.enumerated() {
                if(index == lookup.count-1){
                    return anyObj[str] as? T
                }
                if let o = (anyObj as? [String:AnyObject]),
                 let x = o[str] {
                    anyObj = x;
                }else{
                    return nil;
                }
            }
        }
        return nil
    }
    
}
