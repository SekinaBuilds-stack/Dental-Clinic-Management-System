// backend/src/patients/patients.service.spec.ts
import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientsService } from './patients.service';
import { Patient } from './entities/patient.entity';

const mockPatientRepository = () => ({
  count: vi.fn().mockResolvedValue(0),
  create: vi.fn().mockImplementation((dto: unknown) => dto),
  save: vi.fn().mockImplementation((entity: unknown) => Promise.resolve({ id: 'uuid-test-id', ...(entity as object) })),
  find: vi.fn(),
  findOne: vi.fn(),
});

describe('PatientsService', () => {
  let service: PatientsService;
  let repository: Repository<Patient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: getRepositoryToken(Patient),
          useFactory: mockPatientRepository,
        },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
    repository = module.get<Repository<Patient>>(getRepositoryToken(Patient));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create (Patient Creation & File Number Generation)', () => {
    it('should create a patient, auto-generate a file number, and include medical alerts', async () => {
      const createDto = {
        fullName: 'Abebe Bikila',
        gender: 'Male',
        dateOfBirth: '1992-05-15',
        phoneNumber: '+251911223344',
        medicalAlerts: [
          { alertType: 'Allergy', severity: 'High', description: 'Severe Penicillin allergy' },
        ],
      };

      const result = await service.create(createDto as any);

      expect(result).toHaveProperty('fileNumber');
      expect(result.fileNumber.toString()).toMatch(/^DCMS-\d{4}-\d{4}$/);
      expect(result.fullName).toEqual('Abebe Bikila');
      expect(result.medicalAlerts).toHaveLength(1);
      expect(result.medicalAlerts[0].description).toEqual('Severe Penicillin allergy');
    });
  });

  describe('search (Phone & Query Lookup)', () => {
    it('should return patients matching phone number or query string', async () => {
      const mockList = [
        {
          id: 'uuid-test-id',
          fullName: 'Dawit Yohannes',
          phoneNumber: '+251922334455',
          fileNumber: 'DCMS-2026-0001',
          medicalAlerts: [],
        },
      ];
      vi.spyOn(repository, 'find').mockResolvedValue(mockList as any);

      const result = await service.search('+251922334455');

      expect(result).toEqual(mockList);
      expect(repository.find).toHaveBeenCalled();
    });
  });
});