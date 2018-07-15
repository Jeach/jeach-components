/*
 * Jeach Components Framework 
 *
 * Copyright (C) 2018 by Christian Jean.
 * All rights reserved.
 *
 * CONFIDENTIAL AND PROPRIETARY INFORMATION!
 *
 * Disclosure or use in part or in whole without prior written consent
 * constitutes an infringement of copyright laws which may be punishable
 * by law.
 *
 * THIS SOFTWARE IS PROVIDED "AS IS" AND ANY EXPRESSED OR IMPLIED WARRANTIES
 * INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL
 * THE LICENSOR OR ITS CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
 

var JeachComponent = (function() {
  const COMPS = [];
  const RESP = { success: true, components: [
          { path: "/com/jeach/dashboard/panel/panel", data: "PGRpdiBjbGFzcz0iangtZGFzaGJvYXJkLXBhbmVsIj4KPGRpdiBjbGFzcz0iangtZGFzaGJvYXJkLXBhbmVsLWhlYWRlciI+CjwvZGl2PiAgIyB3aWxsIHBhc3RlIHRoZSBlbnRpcmUgaGVhZGVyIChhbGwgbGFiZWxzKQo8ZGl2IGNsYXNzPSJqeC1kYXNoYm9hcmQtcGFuZWwtY29udGVudCI+CjwvZGl2PiAgIyB3aWxsIHBhc3RlIHRoZSBlbnRpcmUgY29udGVudCAoYWxsIGxhYmVscykKPHA+ICAgIyB3aWxsIHBhc3RlIHRoaXMgbGluZSAnbicgdGltZXMKPGRpdiBjbGFzcz0iangtZGFzaGJvYXJkLXBhbmVsLWZvb3RlciI+CjwvZGl2PiAgIyB3aWxsIHBhc3RlIHRoZSBlbnRpcmUgZm9vdGVyIChhbGwgbGFiZWxzKQo8L2Rpdj4KPGRpdiBjbGFzcz0iangtZGFzaGJvYXJkLXBhbmVsLXRlc3QiPgo8IS0tIFRoaXMgaXMgYSBjb21tZW50IC0tPgo8L2Rpdj4KPHA+ICAgIyBzaW1wbGUgc3RhdGVtZW50Cg==" }
        ]
      };
  
  COMPS.push({"path":"/com/jeach/dashboard/panel/banner","format":"base64","data":"PGRpdiBjbGFzcz0iangtZGFzaGJvYXJkLXBhbmVsIj4KPGRpdiBjbGFzcz0iangtZGFzaGJvYXJkLXBhbmVsLWhlYWRlciI+CjwvZGl2PiAgIyB3aWxsIHBhc3RlIHRoZSBlbnRpcmUgaGVhZGVyIChhbGwgbGFiZWxzKQo8ZGl2IGNsYXNzPSJqeC1kYXNoYm9hcmQtcGFuZWwtY29udGVudCI+CjwvZGl2PiAgIyB3aWxsIHBhc3RlIHRoZSBlbnRpcmUgY29udGVudCAoYWxsIGxhYmVscykKPHA+ICAgIyB3aWxsIHBhc3RlIHRoaXMgbGluZSAnbicgdGltZXMKPGRpdiBjbGFzcz0iangtZGFzaGJvYXJkLXBhbmVsLWZvb3RlciI+CjwvZGl2PiAgIyB3aWxsIHBhc3RlIHRoZSBlbnRpcmUgZm9vdGVyIChhbGwgbGFiZWxzKQo8L2Rpdj4KPGRpdiBjbGFzcz0iangtZGFzaGJvYXJkLXBhbmVsLXRlc3QiPgo8IS0tIFRoaXMgaXMgYSBjb21tZW50IC0tPgo8L2Rpdj4KPHA+ICAgIyBzaW1wbGUgc3RhdGVtZW50Cg=="});
  
  var _isComponentInCache = function(name) {
    var comp = _getComponentFromCache(name);
    return comp !== null;
  }
   
  var _getComponentFromCache = function(name) {
    var comp = null;
    for (var i=0; i<COMPS.length; i++) {
      if (COMPS[i].path === name) {
        comp = COMPS[i];
        break;
      }
    }
    return comp;
  };
   
  var _fetchComponentFromServer = function(name, callback) {
    var comp = null;
    var response = RESP;
    
    for (var i=0; i<response.components.length; i++) {
      var base64 = response.components[i].data;
      var html = Buffer.from(base64, 'base64').toString('utf8');
      response.components[i].data = html;
      response.components[i].format = 'html';
      COMPS.push(response.components[i]);
      if (name === response.components[i].path) comp = response.components[i].data;
    }    
    callback(html, null);
  };
   
  //////////////////////////////////////////////////////////////////////////////////////
  
  var getComponent = function(name, callback) {
    var comp = _getComponentFromCache(name);    
    if (!comp) comp = _fetchComponentFromServer(name, callback);
    else callback(comp, null);
  }
  
  var getCount = function() {
    return COMPS.length; 
  }

  /**
   * Some public methods.
   *
   * @since  1.0
   * @author Christian Jean
   */
  var version = function() {
    return "version";
  };  

  /**
   * Some public methods.
   *
   * @since  1.0
   * @author Christian Jean
   */
  var toString = function() {
    return "JeachComponent@00000000 "
      + " version: " + version()
      + ", components: " + getCount()
      ;
  };
  
	return {
    getComponent: getComponent,
    getCount: getCount,
    version: version,    
    toString: toString
  };
}());

module.exports = JeachComponent;