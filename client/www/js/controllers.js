'use strict';

app.controller('MainCtrl', ['$scope', '$rootScope', '$window', '$location','$http','$localstorage', function ($scope, $rootScope, $window, $location,$http,$localstorage) {
        $scope.slide = '';
        $scope.showLoader=false;
        $scope.loadingMsg="loading";
        $rootScope.back = function() {
          $scope.slide = 'slide-right';
          $window.history.back();
        }
        $rootScope.go = function(path){
          $scope.slide = 'slide-left';
          $location.url(path);
        }
        $rootScope.showLoader = function(msg){
         $scope.showLoader=true;
            if(msg)
                $scope.loadingMsg=msg;
            else
                $scope.loadingMsg="loading";
        }
         $rootScope.hideLoader = function(){
             $scope.showLoader=false;
             $scope.loadingMsg="loading";
        }
        document.addEventListener("backbutton", function(){
            navigator.app.exitApp();
        }, false);
         $rootScope.reloadUserData=function(){
                var userId=$localstorage.get("userId");
             //   userId="557433f16360db6742a1e450";
                $scope.user={};
                $rootScope.showLoader("fetching user details");
                $http.get("https://payall-subbu2107.rhcloud.com/getUser/"+userId).success(function (res) {
                    $rootScope.hideLoader();
                    if(res.success){
                        $scope.user.name=res.result.poi.name;
                        $scope.user.photo=res.result.photo.replace(/\r\n/g,"");
                        $scope.user.balance=res.result.balance;
                    }else{
                        alert("failed to get data");
                    }
                }).error(function(err) {
                    alert(err);
                });
         
         }
       
    }])
    .controller('HomeCtrl', ['$scope', 'CordovaFactory','$localstorage','$http', '$rootScope',function ($scope, CordovaFactory,$localstorage,$http,$rootScope) {
                    
                   
            $rootScope.reloadUserData();
                
            $scope.scan=function(){
                CordovaFactory.scanBarCode().then(function(result){
                    if(!result.cancelled)
                       $scope.pay( result.text);
                    else
                        alert("scanning failed");
                }, function(error){
                    alert(error);
                });
            }
            $scope.pay=function(orderId){
                var orderData={};
                orderData.orderId=orderId;
                orderData.customerId=$localstorage.get("userId");
                $rootScope.showLoader('payment in progress');
                $http.post("https://payall-subbu2107.rhcloud.com/payorder", orderData).success(function(res) {
                    $rootScope.hideLoader();
                    if(res.success){
                        alert("payment successful");
                        $rootScope.reloadUserData();
                    }else{
                        alert("payment failed");
                    }
                }).error(function(err) {
                    alert(err);
                });
            
            }
            $scope.receive=function(){
			
				$('#receivemodal').openModal();
            }   
            $scope.createOrder=function(){
                if($scope.amount !="" && $scope.amount>0){
                    var orderData={};
                    orderData.amount=$scope.amount;
                    $localstorage.set("orderAmount", orderData.amount);
                    orderData.receiverId=$localstorage.get("userId");
                   // orderData.receiverId="557433f16360db6742a1e450";
                    $rootScope.showLoader('creating order');
                    $http.post("https://payall-subbu2107.rhcloud.com/addorder", orderData).success(function(res) {
                        $rootScope.hideLoader();
                        if(res.success){
                            $localstorage.set("orderId",res.result._id);
                            $rootScope.go("/qrcode");
                        }else{
                            alert("failed to get details");
                        }
                    }).error(function(err) {
                        alert(err);
                    });
                }
            }
            
    }]).controller('SignUpCtrl', ['$scope', 'CordovaFactory','$http', '$localstorage','$rootScope',function ($scope, CordovaFactory,$http, $localstorage,$rootScope) {
    
   if($localstorage.get("userId") != undefined){
    // if(true){
        $rootScope.go("/home");
        return;
    }
    $scope.aadhaarNumber="";
           
            $scope.scanaadhar=function(){
                $rootScope.showLoader('loading gps data');
                CordovaFactory.getLocation().then(function(position){
                        $rootScope.hideLoader();
                        var location={};
                        location.type="gps";
                        location.latitude=position.coords.latitude;
                        location.longitude=position.coords.longitude;
                        location.altitude=position.coords.altitude
                        $localstorage.setObject('gps',location);
                    
                        $scope.startScan();
                },function(error){
                    $rootScope.hideLoader();
                alert("fetching location failed.Please make sure gps is turned on.")
                })
                
          }
            $scope.submitAadhaarNumber=function(){
              $scope.aadhaarNumber= $scope.aadhaarNumber.toString();
             if($scope.aadhaarNumber.length==12){
                $rootScope.showLoader('loading gps data');
                 CordovaFactory.getLocation().then(function(position){
                        $rootScope.hideLoader();
                        var location={};
                        location.type="gps";
                        location.latitude=position.coords.latitude;
                        location.longitude=position.coords.longitude;
                        location.altitude=position.coords.altitude
                        $localstorage.setObject('gps',location);
                        $localstorage.set('xmluid' ,  $scope.aadhaarNumber);
                        $scope.callForOtp();
                },function(error){
                    $rootScope.hideLoader();
                alert("fetching location failed.Please make sure gps is turned on.")
                })
                

             }else{
                alert("Please enter a valid Aadhar number")
             }

            }
            $scope.startScan=function(){
            CordovaFactory.scanBarCode().then(function(result){
                    try{
                        if(!result.cancelled){
                    var xmlDoc = $.parseXML( result.text ),
                            $xml = $( xmlDoc ),
                            $aadharData = $xml.find( "PrintLetterBarcodeData" );
                    if($aadharData){
                         $localstorage.set('xmluid' ,  $aadharData.attr("uid"));
                         $localstorage.set('xmlname' ,  $aadharData.attr("name"));
                        
                         $scope.callForOtp();
                    }
                        
                    }
                    }catch(e){
                        alert("Failed to scan try again");
                    }
                }, function(error){
                    alert(error);
                });
            
            }
            
            $scope.callForOtp=function(){
                        var otpRequest={};
                        otpRequest["aadhaar-id"]=$localstorage.get("xmluid");
                        otpRequest["device-id"]= device.uuid;
                        otpRequest["certificate-type"]="preprod";
                        otpRequest["channel"]="SMS";
                        
                        otpRequest.location=$localstorage.getObject('gps');
                        $rootScope.showLoader("waiting for otp");
                        $http.post("https://ac.khoslalabs.com/hackgate/hackathon/otp", otpRequest).success(function (res) {
                            $rootScope.hideLoader();
	                    if(res.success){
                           $('#otpmodal').openModal(); 
                        }else{
                            alert("failed to send otp");
                        }
	                }).error(function(err) {
	                    alert(err);
	                });
            }
          /*  $scope.submitOtp=function(){
                $localstorage.set("otp",$scope.otp)
              var authRequest=  {
                  "aadhaar-id":$localstorage.get("xmluid"),
                  "modality": "otp",
                  "otp":$localstorage.get("otp"),
                  "device-id": device.uuid,
                  "certificate-type": "preprod",
                  "location": $localstorage.getObject('gps')
                }
              $rootScope.showLoader('authenticating otp');
                $http.post("https://ac.khoslalabs.com/hackgate/hackathon/auth/raw", authRequest).success(function (res) {
                    $rootScope.hideLoader();
                    if(res.success){
                       $scope.callKyc();
                    }else{
                        alert("Invald otp");
                    }
                }).error(function(err) {
                    alert(err);
                });
            }*/
            
            $scope.callKyc=function(){
                 $localstorage.set("otp",$scope.otp);
               var kycRequest= {
                  "consent": "Y",
                  "auth-capture-request": {
                    "aadhaar-id":$localstorage.get("xmluid"),
                    "modality": "otp",
                    "otp":$localstorage.get("otp"),
                    "device-id": device.uuid,
                    "certificate-type": "preprod",
                    "location": $localstorage.getObject('gps')
                  }
               }
               $rootScope.showLoader('fetching user details');
                $http.post("https://ac.khoslalabs.com/hackgate/hackathon/kyc/raw", kycRequest).success(function (res) {
                    $rootScope.hideLoader();
                    if(res.success){
                        $localstorage.setObject("userDetails",res.kyc);
                        $scope.createUser(res.kyc);
                    }else{
                        alert("failed to get details");
                    }
                }).error(function(err) {
                    alert(err);
                });
                
            }
             $scope.createUser=function(userData){
                
                $rootScope.showLoader('creating user');
                $http.post("https://payall-subbu2107.rhcloud.com/adduser", userData).success(function(res) {
                    $rootScope.hideLoader();
                    if(res.success){
                       
                       $localstorage.set("userId",res.result._id);
                        $rootScope.go("/home");
                       
                    }else{
                        alert("failed to get details");
                    }
                }).error(function(err) {
                    alert(err);
                });
                
            }
        }]).controller('QrcodeCtrl', ['$localstorage','$rootScope','$scope','$http', function ($localstorage,$rootScope,$scope,$http) {
            $scope.orderAmount=$localstorage.get("orderAmount");
            var qrcode = new QRCode("qrcodeHolder", {
                text: $localstorage.get("orderId"),
                width: 128,
                height: 128,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
            $scope.orderStatus="pending";
            $scope.checkstatus=function(){
                $rootScope.showLoader("fetching order staus");
                $http.get("https://payall-subbu2107.rhcloud.com/getOrder/"+$localstorage.get("orderId")).success(function (res) {
                    $rootScope.hideLoader();
                    if(res.success){
                        $scope.orderStatus=res.result.status;
                       }else{
                         $scope.orderStatus="failed to fetch status";
                    }
                }).error(function(err) {
                    alert(err);
                });
            
            }
        }]);
