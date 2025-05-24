const bcrypt=require('bcrypt')


const securePassword =  async(password) => {
    try {
      const passwordHash =  await bcrypt.hash(password.toString(), 10);
      return passwordHash;
    } catch (error) {
      console.log(error.message);
    }
    // const securePassword = async (password) => {
    //     try {
    //       const passwordHash = await bcrypt.hash(password, 10);
    //       return passwordHash;
    //     } catch (error) {
    //       console.log(error.message);
    //     }
       
    //   };
  };
 

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000);
  };
//  const ouput=   await securePassword(1233)

// above line throw error because should not use await keyword outside async function
// (async () => {
//     const output = await securePassword("33");
//     console.log(output);
// })();
  module.exports={securePassword:securePassword}