import { Request, Response } from 'express-serve-static-core';
import fs from 'fs';
import {IHargaPanganPerProvinsi} from './types';
import {igniteSupport} from '../../ignite_support';

class HargaPanganSkill {
  public getHargaPanganFromCache = async (req:Request,res:Response) => {
    // index daerah ["Aceh","Sumatera Utara","Sumatera Barat","Riau","Kepulauan Riau","Jambi","Bengkulu","Sumatera Selatan","Kepulauan Bangka Belitung","Lampung","Banten","Jawa Barat","DKI Jakarta","Jawa Tengah","DI Yogyakarta","Jawa Timur","Bali","Nusa Tenggara Barat","Nusa Tenggara Timur","Kalimantan Barat","Kalimantan Selatan","Kalimantan Tengah","Kalimantan Timur","Kalimantan Utara","Gorontalo","Sulawesi Selatan","Sulawesi Tenggara","Sulawesi Tengah","Sulawesi Utara","Sulawesi Barat","Maluku","Maluku Utara","Papua","Papua Barat"];
    if(!(req.query.msg)) res.send(JSON.parse(`{"error":"no input msg"}`));
    else {
      const indexReq = +req.query.msg; /** accepted index 1-34 */
      const dataHarga = await this.readCacheFile((indexReq-1));
      res.send(JSON.parse(JSON.stringify(dataHarga)));
      // const dataLokasi = await this.findIndexLocation(req.query.msg);
      // if(dataLokasi.status=="error") res.send(JSON.parse(`{"error":"${dataLokasi.message}"}`));
      // else {
      //   const id = dataLokasi.id;
      //   const idProv = dataLokasi.idProv;
      //   const lokasi = dataLokasi.lokasi;
      //   const dataHarga = await this.readCacheFile((idProv-1));
      //   res.send(JSON.parse(JSON.stringify(dataHarga)));
      // }
    }
  }

  private readCacheFile = async (index:number): Promise<IHargaPanganPerProvinsi> => {
    const data = await igniteSupport.getCacheByNameWithoutClient('cacheHargaPangan',new IHargaPanganPerProvinsi());
    return new Promise((resolve,reject) => {
      resolve(data![index]);
      // fs.readFile(`cache/pangan_per_provinsi.json`, (err, data) => {
      //   if (err) {
      //     reject(err);
      //   } else {
      //     resolve(JSON.parse(data.toString())[index]);
      //   }
      // })
    })
  }

  private findIndexLocation = async(msg:string) : Promise<any> => {
    return new Promise ((resolve,reject) => {
      fs.readFile('dependent/lokasi_pangan.json', (err, data) => {
        if (err) {
          reject(err);
        } else {
          const dataR = JSON.parse(data.toString());
          const provR = ["Aceh","Sumatera Utara","Sumatera Barat","Riau","Kepulauan Riau","Jambi","Bengkulu","Sumatera Selatan","Kepulauan Bangka Belitung","Lampung","Banten","Jawa Barat","DKI Jakarta","Jawa Tengah","DI Yogyakarta","Jawa Timur","Bali","Nusa Tenggara Barat","Nusa Tenggara Timur","Kalimantan Barat","Kalimantan Selatan","Kalimantan Tengah","Kalimantan Timur","Kalimantan Utara","Gorontalo","Sulawesi Selatan","Sulawesi Tenggara","Sulawesi Tengah","Sulawesi Utara","Sulawesi Barat","Maluku","Maluku Utara","Papua","Papua Barat"];
          var found = 0;
          for(var i=0;i<dataR.length;i++){
            // console.log(provR[dataR[i].idProv-1]);
            if(msg.includes(provR[(dataR[i].idProv-1)].toLowerCase())||msg.includes(dataR[i].lokasi.toLowerCase())){
              found = 1;
              break;
            }
          }
          if(found){
            const id = dataR[i].id;
            const idProv = dataR[i].idProv;
            const lokasi = dataR[i].lokasi;
            // res.send(JSON.parse(`{"id":"${id}","idProv":"${idProv}","value":"${lokasi}"}`));
            resolve(JSON.parse(`{"id":"${id}","idProv":"${idProv}","lokasi":"${lokasi}"}`));
          } else {
            resolve(JSON.parse(`{"status":"error","message":"no match location"}`));
          }
        }
      })
    })
  }
}

const hargaPanganSkill = new HargaPanganSkill();
export default hargaPanganSkill;
