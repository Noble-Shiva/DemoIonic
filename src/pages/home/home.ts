import { Component } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
import { AES256 } from '@ionic-native/aes-256';
import {FileChooser} from "@ionic-native/file-chooser";
import { FilePath } from '@ionic-native/file-path';
import { Base64 } from '@ionic-native/base64';

declare var cordova;
declare var window;
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  private secureKey: string;
  private secureIV: string;
  username: any;
  password: any;
  encodedData: any
  dusername: any;
  dpassword: any;
  fileUri: any;
  filepath: any;

  constructor(public navCtrl: NavController, private platform: Platform, 
    private aes256: AES256, private base64: Base64, public fileChooser: FileChooser,
    private filePath: FilePath) {
    this.platform.ready().then((platform) => {
      if(this.platform.is('android')) {
        alert(platform)
        this.generateSecureKeyAndIV();
      } else {
        console.log(platform)
      }
    })
  }

  async generateSecureKeyAndIV() {
    this.secureKey = await this.aes256.generateSecureKey('12345'); // Returns a 32 bytes string
    this.secureIV = await this.aes256.generateSecureIV('12345'); // Returns a 16 bytes string
    console.log('secureKey : ', this.secureKey);
    alert('secureKey : '+ JSON.stringify(this.secureKey));
    console.log('secureIV : ', this.secureIV);
    alert('secureIV : '+ JSON.stringify(this.secureIV));
 }

  encodeData() {
    let creds = {
      username : this.username,
      password : this.password
    }
    this.aes256.encrypt(this.secureKey, this.secureIV, JSON.stringify(creds) )
    .then((res) => {
      this.encodedData = res
      console.log('Encrypted Data: ',res);
      alert('Encoded Data : ' + JSON.stringify(res))
      //this.decodeData(res)
    })
    .catch((error: any) => console.error(error));
  }

  decodeData() {
    this.aes256.decrypt(this.secureKey, this.secureIV, this.encodedData)
    .then((res: any) => {
      console.log('Decrypted Data : ',res);
      let data = JSON.parse(res);
      this.dusername = data.username;
      this.dpassword = data.password;
      alert('Decoded Data : '+ JSON.parse(data))
    })
    .catch((error: any) => console.error(error));
  }

  filechange(event) {
    if(event.target.files[0]) {
      let file = event.target.files[0];
      console.log('Selected File : ', file);
    }

    
    // this.base64.encodeFile(filePath).then((base64File: string) => {
    //   console.log(base64File);
    // }, (err) => {
    //   console.log(err);
    // });
  }

  onFileChange(event) {
    if(event.target.files && event.target.files.length > 0) {
      let reader = new FileReader();
      let file = event.target.files[0];
      console.log('Selected File : ', file);
      reader.readAsDataURL(file);
      console.log(reader.result)
      // reader.onload = () => {
      //   this.form.get('avatar').setValue({
      //     filename: file.name,
      //     filetype: file.type,
      //     value: reader.result.split(',')[1]
      //   })
      // };
      reader.onloadend = (ev: any) => {
        console.log(ev.target.result)
        //this.base64ToFile(ev.target.result,'uae.img','')
        this.convertToFile(ev.target.result,'')
      }

      

    }
  }

  openFile() {
    if (this.platform.is('android')){

      this.fileChooser
      .open()
      .then(uri => {
        console.log('URI : ', uri);
        alert('URI : ' + JSON.stringify(uri));
        this.fileUri = uri;

        this.filePath.resolveNativePath(this.fileUri)
        .then((filePath) => {
          console.log('File Path : ', filePath);
          this.filepath = filePath;

          // this.file.readAsDataURL(this.fileUri, this.fileUri)
          // .then((data) => {
          //   console.log('Base64Data : ', data);
          // }).catch((err) => {
          //   console.log('Base64Data Error', err)
          // })

          this.base64.encodeFile(this.filepath)
          .then((base64File: string) => {
            console.log('Base64 File : ', base64File);
            alert('Base64 Output : '+ JSON.stringify(base64File));
            //this.convertToFile(base64File, null);
            this.base64ToFile(base64File,null,null);
          }).catch((err) => {
            console.log(err)
          })

        }).catch((err)=> {
          console.log(err.message)
        })

      })
      .catch(e => alert('FileChooser Error : ' + JSON.stringify(e.message)));
    }
  }

  convertToFile(b64Data, contentType) {
    //public base64toBlob(b64Data, contentType) {
      contentType = contentType || '';
      let sliceSize = 512;
      let byteCharacters = atob(b64Data);
      let byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        let slice = byteCharacters.slice(offset, offset + sliceSize);
        let byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        var byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      let blob = new Blob(byteArrays, {
        type: contentType
      });
      console.log('Blob : ', blob)
      return blob;
    //}
  }

  base64ToFile(base64Data, tempfilename, contentType) {
    contentType = contentType || '';
    tempfilename = 'sometext';
    var sliceSize = 1024;
    var byteCharacters = atob(base64Data);
    var bytesLength = byteCharacters.length;
    var slicesCount = Math.ceil(bytesLength / sliceSize);
    var byteArrays = new Array(slicesCount);

    for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        var begin = sliceIndex * sliceSize;
        var end = Math.min(begin + sliceSize, bytesLength);

        var bytes = new Array(end - begin);
        for (var offset = begin, i = 0 ; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
        }
        byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    var file = new File(byteArrays, tempfilename, { type: contentType });
    alert('File again : ' + JSON.stringify(file))
    //return file;
    this.saveFileToStorage(file)
  }

  saveFileToStorage(file) {
    let folderpath = cordova.file.externalRootDirectory;
    let filename = 'uaex.png'
    window.resolveLocalFileSystemURL(folderpath, function(dir) {
      console.log("Access to the directory granted succesfully");
      dir.getFile(filename, {create:true}, function(file) {
          console.log("File created succesfully.");
          file.createWriter(function(fileWriter) {
              console.log("Writing content to file");
              alert('writing to storage')
              fileWriter.write(file);
          }, function(){
              alert('Unable to save file in path '+ folderpath);
          });
        });
      });
  }

}
